from selenium.webdriver.common.by import By


class LocatorAvito:
    """Все необходимые селекторы"""
    NAME = (By.CSS_SELECTOR, "[itemprop='name']")
    DESCRIPTIONS = (By.CSS_SELECTOR, "[class*='item-description']")
    DATE_PUBLIC = (By.CSS_SELECTOR, "[data-marker='item-view/item-date']")

