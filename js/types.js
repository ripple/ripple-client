var AmountValue = (function () {
  function repeat_str(s, n) {
    return (new Array(n+1)).join(s);
  }
  function mod(x, n) {
    if (x >= 0) return x % n;
    else return x % n + n;
  }
  function sub(a, b) {
    return a - b;
  }
  function add(a, b) {
    return a + b;
  }
  
  var AmountValue = function (s) {
    if (this == window) throw "Use the new keyword, please."
    
    if (s === undefined || !(s.constructor == Number || s.constructor == String))
      throw "AmountValue takes one argument which must be a Number or String."
    
    if (s.constructor == Number) {
      AmountValue.call(this, String(s));
      return;
    }
    
    var m = s.match(/^[-+]?0*([0-9]*)(\.([0-9]*?)0*)?$/);
    
    if (!s || !m) throw "Invalid value for AmountNumber."
    
    this.sign = (s[0] == '+' || s[0] == '-') ? s[0] : '+';
    
    var whole = m[1] || "",
        decim = m[3] || "",
        digits = (whole + decim),
        m = digits.match(/^(0*)([0-9]+?)0*$/),
        leadZeros = m ? m[1] : "",
        mantissa = m ? m[2] : "0",
        exp = whole.length - leadZeros.length - 16;
    
    if (mantissa.length < 16) {
      mantissa += repeat_str("0", 16 - mantissa.length);
    }
    
    this.exponent = this.isZero() ? 0 : exp;
    
    if (mantissa.length > 16 || this.exponent > 80 || this.exponent < -96) {
      throw "This number cannot be represented."
    }
    
    this.mantissa = mantissa;
  };
  
  AmountValue.prototype.toString = function () {
    var sign = this.sign == '-' ? '-' : '';
    if (this.exponent == 0) {
      return sign + this.mantissa;
    } else if (this.exponent > 0) {
      return sign + this.mantissa + repeat_str("0", this.exponent);
    } else if (this.exponent < 0) {
      var point = this.mantissa.length + this.exponent,
          whole = this.mantissa.slice(0, point < 0 ? 0 : point) || "0",
          decim = point < 0 ? repeat_str("0", -point) + this.mantissa
                            : this.mantissa.slice(point, this.mantissa.length),
          decim = decim.replace(/0*$/, '');
      return sign + whole + (decim ? "." + decim : "");
    }
  };
  
  AmountValue.prototype.isZero = function () {
    return this.mantissa == "0000000000000000";
  };
  
  AmountValue.prototype.compareTo = function (other) {
    if (this.sign != other.sign) {
      return this.sign == '-' ? -1 : 1;
    }
    
    if (this.exponent > other.exponent) {
      return this.sign == '-' ? -1 : 1;
    } else if (this.exponent < other.exponent) {
      return this.sign == '-' ? 1 : -1;
    } else {
      if (this.mantissa > other.mantissa) {
        return this.sign == '-' ? -1 : 1;
      } else if (this.mantissa < other.mantissa) {
        return this.sign == '-' ? 1 : -1;
      } else {
        return 0;
      }
    }
  };
  
  AmountValue.prototype.divide = function (other) {
    if (!isNaN(other) && (other.constructor == String || other.constructor == Number)) {
      return this.divide(new AmountValue(String(other)));
    } else if (other && other.constructor == AmountValue) {
      if (other.isZero()) {
        throw "Cannon divide by zero."
      } else if (other.mantissa == '1000000000000000') {
        this.exponent -= (other.exponent + 15);
      } else {
        throw "Dividing by this number not yet implemented."
      }
    } else {
      throw "divide method takes a numeric String, Number, or AmountValue."
    }
    return this;
  };
  
  AmountValue.prototype.abs = function () {
    return new AmountValue(this.toString().replace(/^-/, ''));
  };
  
  AmountValue.prototype.neg = function () {
    if (this.sign == '-') {
      return new AmountValue(this.toString().replace(/^-/, ''));
    } else {
      return new AmountValue('-' + this.toString());
    }
  };
  
  AmountValue.prototype.sub = function (other) {
    if (!isNaN(other) && (other.constructor == String || other.constructor == Number)) {
      return this.sub(new AmountValue(String(other)));
    } else if (other && other.constructor == AmountValue) {
      return this.add(other.neg());
    } else {
      throw "sub method takes a numeric String, Number, or AmountValue."
    }
    return this;
  };
  
  AmountValue.prototype.add = function (m) {
    if (!isNaN(m) && (m.constructor == String || m.constructor == Number)) {
      // m is numeric string or number
      return this.add(new AmountValue(String(m)));
    } else if (m && m.constructor == AmountValue) {
      var same_sign = this.sign == m.sign,
          comp = this.compareTo(m.abs()),
          smaller = comp < 0 ? this : m,
          bigger = comp < 0 ? m : this,
          exp_diff = bigger.exponent - smaller.exponent,
          big = bigger.mantissa + repeat_str("0", exp_diff),
          sml = repeat_str("0", big.length - smaller.mantissa.length) + smaller.mantissa;
      
      var res = [], carry = 0;
      
      for (var i = big.length - 1; i >= 0; i--) {
        var x = (same_sign ? add : sub)(Number(big[i]), (Number(sml[i]) + carry));
        res.unshift(mod(x, 10));
        carry = Number(x > 10 || x < 0);
      }
      
      res.unshift(carry);
      res = res.join(''); // res is now a string
      
      if (smaller.exponent >= 0) {
        res += repeat_str("0", smaller.exponent);
      } else {
        var whole = res.slice(0, res.length + smaller.exponent) || "0",
            decim = res.slice(res.length + smaller.exponent, res.length).replace(/0*$/, '');
        res = bigger.sign + whole + "." + decim;
      }
      
      res = new AmountValue(res); // res is on a horse
      this.sign = res.sign;
      this.mantissa = res.mantissa;
      this.exponent = res.exponent;
      
      return this;
    } else {
      throw "add method takes a numeric String, Number, or AmountValue"
    }
  };
  
  return AmountValue;
})();

// var a = (new AmountValue("-0.1234567890")).add(1).toString()
// if (a != "0.876543211") throw "bad"
// 
// a = new AmountValue("0");
// if (a.mantissa != '0000000000000000') throw "bad"
// if (a.exponent != 0) throw "bad"
// 
// a = new AmountValue("0.1234567890")
// if (a.mantissa != '1234567890000000') throw "bad"
// if (a.exponent != -16) throw "bad"
// 
// a = new AmountValue("0.001234567890")
// if (a.mantissa != '1234567890000000') throw "bad " + a.mantissa
// if (a.exponent != -18) throw "bad " + a.exponent
// 
// a = new AmountValue("123456789012345600")
// if (a.mantissa != '1234567890123456') throw "bad " + a.mantissa
// if (a.exponent != 2) throw "bad " + a.exponent
// 
// a = new AmountValue("1234567890123456")
// if (a.mantissa != '1234567890123456') throw "bad " + a.mantissa
// if (a.exponent != 0) throw "bad " + a.exponent
// 
// a = new AmountValue("1000000000000000000", true)
// if (a.mantissa != '1000000000000000') throw "bad"
// if (a.exponent != 3) throw "bad"
// 
// console.log("all good")
// 
// 
