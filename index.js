
var fs = require('fs');
const miio = require('miio');
var Accessory, Service, Characteristic, UUIDGen;

module.exports = function(homebridge) {
    if(!isConfig(homebridge.user.configPath(), "accessories", "DeMiHumidifier")) {
        return;
    }

    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerAccessory('homebridge-mi-dehumidifier', 'DeMiHumidifier', DeMiHumidifier);
}

function isConfig(configFile, type, name) {
    var config = JSON.parse(fs.readFileSync(configFile));
    if("accessories" === type) {
        var accessories = config.accessories;
        for(var i in accessories) {
            if(accessories[i]['accessory'] === name) {
                return true;
            }
        }
    } else if("platforms" === type) {
        var platforms = config.platforms;
        for(var i in platforms) {
            if(platforms[i]['platform'] === name) {
                return true;
            }
        }
    } else {
    }
    
    return false;
}

function DeMiHumidifier(log, config) {
    if(null == config) {
        return;
    }

    this.log = log;
    this.config = config;
	//this.model = config.model || 'v1'
    
    this.log.info("[MiDeHumidifierPlatform][INFO]***********************************************************");
    this.log.info("[MiDeHumidifierPlatform][INFO]          MiHumidifierPlatform v%s by hassbian-ABC 0.0.1");
    this.log.info("[MiDeHumidifierPlatform][INFO]  GitHub: https://github.com/hassbian-ABC/homebridge-mi-dehumidifier ");
    this.log.info("[MiDeHumidifierPlatform][INFO]                                                                  ");
    this.log.info("[MiDeHumidifierPlatform][INFO]***********************************************************");
    this.log.info("[MiDeHumidifierPlatform][INFO]start success...");


    var that = this;
    this.device = new miio.Device({
        address: that.config.ip,
        token: that.config.token

    });
}

DeMiHumidifier.prototype = {
    identify: function(callback) {
        callback();
    },

    getServices: function() {
        var that = this;
        var services = [];

        var infoService = new Service.AccessoryInformation();
        infoService
            .setCharacteristic(Characteristic.Manufacturer, "SmartMi")
            .setCharacteristic(Characteristic.Model, "DeHumidifier")
            .setCharacteristic(Characteristic.SerialNumber, this.config.ip);
        services.push(infoService);
		
	var dehumidifierService = new Service.HumidifierDehumidifier(this.name);
        var currentHumidityCharacteristic = dehumidifierService.getCharacteristic(Characteristic.CurrentRelativeHumidity);
        var currentHumidifierDehumidifierStateCharacteristic = dehumidifierService.getCharacteristic(Characteristic.CurrentHumidifierDehumidifierState);
	currentHumidifierDehumidifierStateCharacteristic.setProps({
            validValues: [0,3]
        });
        var targetHumidifierDehumidifierStateCharacteristic = dehumidifierService.getCharacteristic(Characteristic.TargetHumidifierDehumidifierState);
        targetHumidifierDehumidifierStateCharacteristic.setProps({
            validValues: [2]
        });

        var activeCharacteristic = dehumidifierService.getCharacteristic(Characteristic.Active);
        var lockPhysicalControlsCharacteristic = dehumidifierService.addCharacteristic(Characteristic.LockPhysicalControls);
        var rotationSpeedCharacteristic = dehumidifierService.getCharacteristic(Characteristic.RotationSpeed);
		
		rotationSpeedCharacteristic.setProps({
	      minValue: 0,
          maxValue: 3,
          minStep: 1,
	    });

		var relativeHumidityDeHumidifierThresholdCharacteristic = dehumidifierService.addCharacteristic(Characteristic.RelativeHumidityDehumidifierThreshold);
		relativeHumidityDeHumidifierThresholdCharacteristic.setProps({
		  minValue: 0,
          maxValue: 100,
          minStep: 10, 
        });
        
		var swingModeControlsCharacteristic = dehumidifierService.addCharacteristic(Characteristic.SwingMode);
		
		
		
        activeCharacteristic
        .on('get', function(callback) {
            that.device.call("get_prop", ["on_off"]).then(result => {
		    that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Active - getActive: " + result);
                callback(null, result[0] === "on" ? Characteristic.Active.ACTIVE : Characteristic.Active.INACTIVE);
            }).catch(function(err) {
			    that.log.error("[MiHumidifier][DEBUG]HumidifierDehumidifier - Active - getActive Error: " + err);
                callback(err);
            });
        }.bind(this))
        .on('set', function(value, callback) {
			that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Active - setActive: " + value);
            that.device.call("set_power", [value ? "on" : "off"]).then(result => {
			that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Active - setActive Result: " + result);
                if(result[0] === "ok") {
                    callback(null);
                } else {
                    callback(new Error(result[0]));
                }            
            }).catch(function(err) {
				that.log.error("[MiHumidifier][DEBUG]HumidifierDehumidifier - Active - setActive Error: " + err);
                callback(err);
            });
        }.bind(this));


    currentHumidifierDehumidifierStateCharacteristic
        .on('get', function(callback) {
            that.device.call("get_prop", ["on_off"]).then(result => {
				that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Active - getActive: " + result);
                callback(null, result[0] === "on" ? Characteristic.CurrentHumidifierDehumidifierState.DEHUMIDIFYING : Characteristic.CurrentHumidifierDehumidifierState.INACTIVE);
            }).catch(function(err) {
				that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Active - getActive Error: " + err);
                callback(err);
            });
        }.bind(this));
		

    targetHumidifierDehumidifierStateCharacteristic.setValue(Characteristic.TargetHumidifierDehumidifierState.DEHUMIDIFIER);


currentHumidityCharacteristic.on('get', function (callback){
        that.device.call("get_prop", ["humidity"]).then(result => {
		that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Humidity - getHumidity: " + result);
        callback(null, result[0]);
    }).catch(function(err) {
		that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Humidity - getHumidity Error: " + err);
        callback(err);
    });
}.bind(this)); 


swingModeControlsCharacteristic
    .on('get', function (callback){
    	that.device.call("get_prop", ["mode"]).then(result => {
        callback(null, result[0] === "auto" ? Characteristic.SwingMode.SWING_ENABLED : Characteristic.SwingMode.SWING_DISABLED);
        }).catch(function(err) {
           callback(err);
        });
   }.bind(this))
    .on('set', function(value, callback) {
            that.device.call("set_mode", [value ? "auto" : "dry_cloth"]).then(result => {
                if(result[0] === "ok") {
                    callback(null);
                } else {
                    callback(new Error(result[0]));
                }            
            }).catch(function(err) {
                callback(err);
            });
        }.bind(this));



lockPhysicalControlsCharacteristic
    .on('get', function(callback) {
        that.device.call("get_prop", ["child_lock"]).then(result => {
			that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Child Lock - getchildlock: " + result);
            callback(null, result[0] === "on" ? Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED : Characteristic.LockPhysicalControls.CONTROL_LOCK_DISABLED);
        }).catch(function(err) {
			that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Child Lock - getchildlock: " + err);
            callback(err);
        });
    }.bind(this))
    .on('set', function(value, callback) {
		that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Child Lock - setchildlock: " + value);
        that.device.call("set_child_lock", [value ? "on" : "off"]).then(result => {
            if(result[0] === "ok") {
                callback(null);
            } else {
                callback(new Error(result[0]));
            }            
        }).catch(function(err) {
			that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Child Lock - setchildlock: " + err);
            callback(err);
        });
}.bind(this));

    

rotationSpeedCharacteristic			  
     .on('get', function(callback) {
            that.device.call('get_prop',['fan_st']).then(result => {
				that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - getMode: " + result);
				callback(null, result[0]);
            }).catch(function(err) {
				that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - getMode Error: " + err);
                callback(err);
            });
        }.bind(this))
        .on('set', function(value, callback) {
			    that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - setMode: " + value);
			if (value == 0) {
				that.device.call("set_power", ["off"]).then(result => {
                        if(result[0] === "ok") {
                            callback(null);
                        } else {
                            callback(new Error(result[0]));
                        }
					}).catch(function(err) {
						that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - setMode Error: " + err);
                        callback(err);
                    });
			} else {
				that.device.call("set_fan_level", [value]).then(result => {
                        if(result[0] === "ok") {
                            callback(null);
                        } else {
                            callback(new Error(result[0]));
                        }
					}).catch(function(err) {
						that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - setMode Error: " + err);
                        callback(err);
                    });
			}
        }.bind(this));  



relativeHumidityDeHumidifierThresholdCharacteristic
   .on('get', function(callback) {
	   that.device.call("get_prop", ["auto"]).then(result => {
		that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Humidity - getHumidity: " + result);
        callback(null, result[0]);
    }).catch(function(err) {
		that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Humidity - getHumidity Error: " + err);
        callback(err);
    });
        }.bind(this)) 
    .on('set', function(value, callback) {
		if(value > 0 && value <= 40) {
			value = 40;
		} else if(value > 60 && value <= 100) {
            value = 60;
		}
	    that.device.call("set_auto", [value]).then(result => {
                        if(result[0] === "ok") {
                            callback(null);
                        } else {
                            callback(new Error(result[0]));
                        }
					}).catch(function(err) {
						that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - setMode Error: " + err);
                        callback(err);
                    });
        }.bind(this));

     
		
    services.push(dehumidifierService);
	
    if(!this.config['showTemperatureDisable']) {
	var temperatureSensorService = new Service.TemperatureSensor(this.config['showTemperatureSensorName']);
        temperatureSensorService
		    .getCharacteristic(Characteristic.CurrentTemperature)
			.on('get', function(callback) {
                    that.device.call("get_prop", ["temp"]).then(result => {
					that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - getTemperature: " + result);
                    callback(null, result[0]);
            }).catch(function(err) {
				that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - getTemperature Error: " + err);
				callback(err);
		    });
        }.bind(this));
	services.push(temperatureSensorService);
	
	}
    return services;

	} 
	
}
