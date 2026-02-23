Feature: Login functionality

  Scenario: Successful login
    Given user is on login page
    When user logs in with valid credentials
    Then login should be successful

  Scenario: Invalid login
    Given user is on login page
    When user logs in with invalid credentials
    Then login should fail