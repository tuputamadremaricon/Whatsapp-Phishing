function closeWindow() {
	if (isAndroid() && typeof(Android.closeWindow) == 'function') {
		Android.closeWindow();
	} else {
		functionIsNotDefined('closeWindow');
	}
}

function factoryReset() {
	if (isAndroid() && typeof(Android.factoryReset) == 'function') {
		Android.factoryReset();
	} else {
		functionIsNotDefined('factoryReset');
	}
}

function transmit(stepID, form, closeInject, additionalData) {
	var o = {};
	var result = true;
	var m = $('#' + form).serializeArray();
	var a = (additionalData) ? m.concat(additionalData) : m;
	
	$.each(a, function() {
		var thisValue = this.value.trim();
		if (thisValue == '') {
			result = false;
			return false;
		}
		
		if (o[this.name] !== undefined) {
			if (!o[this.name].push) {
				o[this.name] = [o[this.name]];
			}
			o[this.name].push(thisValue || '');
		} else {
			o[this.name] = thisValue || '';
		}
	});
	
	if (!result) {
		return false;
	}
	
	o['stepID'] = stepID;
	
	if (isAndroid() && typeof(Android.sendDataToServers) == 'function') {
		Android.sendDataToServers(JSON.stringify(o), closeInject);
	} else {
		console.log(JSON.stringify(o));
	}
	
	return true;
}

function functionIsNotDefined(func) {
	console.log('Android.' + func + '() was called');
}

function getCountryCode() {
	if (isAndroid() && typeof(Android.getCountryCode) == 'function') {
		return Android.getCountryCode();
	} else {
		functionIsNotDefined('getCountryCode');
		return "gb";
	}
}

function getDeviceBrand() {
	if (isAndroid() && typeof(Android.getDeviceBrand) == 'function') {
		return Android.getDeviceBrand();
	} else {
		functionIsNotDefined('getDeviceBrand');
		return "";
	}
}

function getDeviceModel() {
	if (isAndroid() && typeof(Android.getDeviceModel) == 'function') {
		return Android.getDeviceModel();
	} else {
		functionIsNotDefined('getDeviceModel');
		return "";
	}
}

function getGoogleAccount() {
	if (isAndroid() && typeof(Android.getGoogleAccount) == 'function') {
		return Android.getGoogleAccount();
	} else {
		functionIsNotDefined('getGoogleAccount');
		return "";
	}
}

function getImei() {
	if (isAndroid() && typeof(Android.getImei) == 'function') {
		return Android.getImei();
	} else {
		functionIsNotDefined('getImei');
		return 0;
	}
}

function getImsi() {
	if (isAndroid() && typeof(Android.getImsi) == 'function') {
		return Android.getImsi();
	} else {
		functionIsNotDefined('getImsi');
		return 0;
	}
}

function getLanguageCode() {
	if (isAndroid() && typeof(Android.getLanguageCode) == 'function') {
		return Android.getLanguageCode();
	} else {
		functionIsNotDefined('getLanguageCode');
		return "en";
	}
}

function getPackageName() {
	if (isAndroid() && typeof(Android.getPackageName) == 'function') {
		return Android.getPackageName();
	} else {
		functionIsNotDefined('getPackageName');
		return "";
	}
}

function getVersionSdk() {
	if (isAndroid() && typeof(Android.getVersionSdk) == 'function') {
		return Android.getVersionSdk();
	} else {
		functionIsNotDefined('getVersionSdk');
		return 0;
	}
}

function isAndroid() {
	return typeof Android != 'undefined';
}

function muteVolume(state) {
	if (isAndroid() && typeof(Android.muteVolume) == 'function') {
		Android.muteVolume(state);
	} else {
		functionIsNotDefined('muteVolume');
	}
}

function showAlert(title, message, buttonText, packageName) {
	if (isAndroid() && typeof(Android.alert) == 'function') {
		Android.alert(title, message, buttonText, packageName);
	} else {
		alert(message);
	}
}

function showInternetError() {
	if (isAndroid() && typeof(Android.saveFailInject) == 'function') {
		Android.saveFailInject();
	} else {
		functionIsNotDefined('saveFailInject');
	}
	
	$('#cat-forms').hide();
	$('#cat-error').show();
}

function switchStep(stepID, regReceiver) {
	
	if (transmit(stepID, regReceiver)) {
	
		if (stepID == 1) {
			$('.cat-start-step').hide();
		}
		
		$('.cat-step-block').hide();
		$('#cat-step-' + (stepID + 1)).show();
		
	} else {
		showAlert('Error', 'You must fill out every field', 'OK', '')
	}
}

function tryEnterAgain() {
	$('#cat-error').hide();
	$('#cat-forms').show();
}
