/**
 * Color manager
 */

var module = angular.module('colormanager', []);


module.factory('rpColorManager', function () {
  
  function colorHexToRGB(colorHex) {
    if (colorHex.charAt(0) === "#") {
      colorHex = colorHex.slice(1);
    }
    if (colorHex.length === 3) {
      colorHex = ""+
        colorHex.charAt(0)+colorHex.charAt(0)+
        colorHex.charAt(1)+colorHex.charAt(1)+
        colorHex.charAt(2)+colorHex.charAt(2);
    }
    var red   = parseInt(colorHex.substring(0,2), 16),
        green = parseInt(colorHex.substring(2,4), 16),
        blue  = parseInt(colorHex.substring(4,6), 16);
    return [red, green, blue];
  }
  
  function colorRGBToHex(colorRGB) {
    return "#" + colorRGB.map(function(v){
      var s = Math.round(v).toString(16);
      s.length === 1 && (s = "0"+s);
      return s;
    }).join("");
  }
  
  function invertColorRGB(colorRGB) {
    return [
      255-colorRGB[0],
      255-colorRGB[1],
      255-colorRGB[2]
    ];
  }
  
  function darken(colorHex, factor) {
    return colorRGBToHex(
      colorHexToRGB(colorHex).map(function(v){return v/factor})
    );
  }
  
  function lighten(colorHex, factor) {
    return colorRGBToHex(
      invertColorRGB(
        invertColorRGB(
          colorHexToRGB(colorHex)
        ).map(function(v){return v/factor})
      )
    );
  }
  
  function shades(colorHex) {
    return [
      darken(colorHex, Math.SQRT2),
      lighten(colorHex, Math.SQRT2)
    ];
  }

  var currencyColors = {
    XRP : '#346aa9',
    USD : "#32b450",
    BTC : "#dc8246",
    EUR : "#fae632",
    CNY : "#c82832",
    JPY : "#8c466e",
    CAD : "#8264be"
  };
  
  var defaultColors = [
    "#3c3ca0",
    "#999999"
  ];

  function CurrencyColorGenerator() {
    var index = 0;
    return {
      generateColor: function(cur) {
        var cc = currencyColors[cur];
        if (!cc) {
          cc = defaultColors[index % defaultColors.length];
          index++
        }
        return cc;
      }
    }
  }
  
  
  return {
    colorHexToRGB          : colorHexToRGB,
    colorRGBToHex          : colorRGBToHex,
    invertColorRGB         : invertColorRGB,
    darken                 : darken,
    lighten                : lighten,
    shades                 : shades,
    currencyColors         : currencyColors,
    CurrencyColorGenerator : CurrencyColorGenerator
  };
  
  
});