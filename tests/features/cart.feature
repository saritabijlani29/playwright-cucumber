Feature: Cart functionality

  Scenario: Add product to cart
    Given user is on home page
    When user adds first product to cart
    And user navigates to cart page
    Then product should be visible in cart
