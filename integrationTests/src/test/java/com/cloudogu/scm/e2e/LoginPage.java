package com.cloudogu.scm.e2e;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.ExpectedCondition;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class LoginPage extends Page {

    private final WebDriver driver;

    @FindBy(id ="username")
    WebElement usernameField;
    @FindBy(id ="password")
    WebElement passwordField;
    @FindBy(css = "input[name='submit']")
    WebElement submitButton;

    public LoginPage(WebDriver driver) {
        super(driver);
        this.driver = driver;
        PageFactory.initElements(driver, this);
    }

    public static ExpectedCondition present() {
        return ExpectedConditions.presenceOfElementLocated(By.cssSelector("input[name='submit']"));
    }

    @Override
    public boolean isDisplayed() {
        return submitButton.isDisplayed();
    }

    public void login(String username, String password) {
        usernameField.sendKeys(username);
        passwordField.sendKeys(password);
        submitButton.click();
    }
}
