'use strict';

var protractor = require('protractor');
var ptor = protractor.getInstance();
var helper_routechange = require('./utils/browser')(ptor);
var helper_forms = require('./utils/forms')(ptor);
var config = require('../protractor.conf.js').config;
var timeout = 100000;

describe('Navigation', function(){

    var gotopath = '#/balance';
    helper_forms.login(config.user.username,config.user.password,gotopath);

    beforeEach(function(){
        ptor.get('#/balance');
    });

    describe('Header dropdown menu', function(){

        it('Should not have dropdown menu displayed when route first changed', function(){

            ptor.findElement(protractor.By.className('mainnav'))
                .findElement(protractor.By.className('settings'))
                .findElement(protractor.By.className('dropdown-menu')).isDisplayed()
                .then(function(displayed){
                    expect(displayed).toEqual(false);
                });

        }, timeout);

        it('Should display dropdown menu when users clicks gear/settings icon', function(){

            ptor.findElement(protractor.By.className('mainnav'))
                .findElement(protractor.By.className('settings')).click()
                .then(function(){
                    ptor.findElement(protractor.By.className('mainnav'))
                        .findElement(protractor.By.className('settings'))
                        .findElement(protractor.By.className('dropdown-menu')).isDisplayed()
                        .then(function(displayed){
                            expect(displayed).toEqual(true);
                        });
                });

        }, timeout);

        it('Should return user to the Login when Logout is clicked', function(){

            ptor.findElement(protractor.By.className('mainnav'))
                .findElement(protractor.By.className('settings')).click()
                .then(function(){

                    ptor.findElement(protractor.By.className('mainnav'))
                        .findElement(protractor.By.className('settings'))
                        .findElement(protractor.By.className('dropdown-menu'))
                        .findElement(protractor.By.css('li:nth-child(5)')).click()
                        .then(function(){
                            helper_routechange.waitForNavigation('#/login');
                        });
                });
        }, timeout);

    });
});