from selenium.webdriver.common.by import By


class LocatorAvito:
    """Все необходимые селекторы"""
    NAME = (By.CSS_SELECTOR, "[itemprop='name']")
    DESCRIPTIONS = (By.CSS_SELECTOR, "[class*='item-description']")

