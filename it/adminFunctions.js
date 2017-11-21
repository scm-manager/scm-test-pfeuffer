const config = require('./config');
const webdriver = require('selenium-webdriver');
const request = require('supertest');
const By = webdriver.By;
const until = webdriver.until;

module.exports = class adminFunctions{

    constructor(driver) {
        this.driver = driver;
    };

    async login(relativeUrl) {
       this.driver.get(config.baseUrl + relativeUrl);
       this.driver.findElement(By.id('username')).sendKeys(config.username);
       this.driver.findElement(By.id('password')).sendKeys(config.password);
       this.driver.findElement(By.css('input[name="submit"]')).click();
    };

    async createUser(){

        await request(config.baseUrl)
            .post('/usermgt/api/users/')
            .auth(config.username, config.password)

            .set('Content-Type', 'application/json;charset=UTF-8')
            .type('json')
            .send({'memberOf':[config.adminGroup],
                'username':config.testuserName,
                'givenname':config.testuserFirstname,
                'surname': config.testuserSurname,
                'displayName':config.testuserDisplay,
                'mail':config.testuserEmail,
                'password':config.testuserPasswort});
    };

    async removeUser(){

        await request(config.baseUrl)
            .del('/usermgt/api/users/' + this.testuserName)
            .auth(config.username, config.password);

        this.login('/scm');
        //delete user in scm
        await this.driver.get(config.baseUrl + '/scm/#userPanel;' + config.testuserName);
        await this.driver.wait(until.elementLocated(By.id('ext-comp-1022')), 5000).click();
        await this.driver.findElement(By.id('ext-comp-1048')).click();

    };

    async testuserLogin() {
        this.driver.get(config.baseUrl + '/scm');
        this.driver.findElement(By.id('username')).sendKeys(config.testuserName);
        this.driver.findElement(By.id('password')).sendKeys(config.testuserPasswort);
        this.driver.findElement(By.css('input[name="submit"]')).click();

        // waiting for finishing loading
        this.driver.wait(until.elementLocated(By.css('#scm-userinfo-tip')), 5000);
        const userInfoElement = this.driver.findElement(By.id('scm-userinfo-tip'));
        this.driver.wait(until.elementTextIs(userInfoElement, config.testuserName), 5000);

    }

    async testuserLogout() {
        await this.driver.wait(until.elementLocated(By.css('a.logout')), 5000);
        await this.driver.findElement(By.css('a.logout')).click();
    };

};