import time
import random
import undetected_chromedriver as uc
from plyer import notification

# URL to monitor
BOOKMYSHOW_URL = "https://in.bookmyshow.com/movies/kochi/sinners/ET00413379"  # Replace with movie page

def setup_stealth_driver():
    options = uc.ChromeOptions()

    # Remove headless to avoid detection
    options.headless = False
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--disable-infobars")
    options.add_argument("--disable-extensions")
    options.add_argument("--disable-gpu")
    options.add_argument("--start-maximized")

    # Spoofing User-Agent (optional)
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")

    # Initialize driver with options
    driver = uc.Chrome(options=options)
    return driver

def send_notification():
    notification.notify(
        title="BOOK TICKET NOW",
        message="🎬 'In cinemas' found on BookMyShow page.",
        timeout=10
    )

def check_page_for_text(driver):
    try:
        driver.get(BOOKMYSHOW_URL)
        time.sleep(5)  # Let page fully load

        page_content = driver.page_source.lower()

        # List of phrases to check for
        check_phrases = [
            "in cinemas",
            "book tickets",
            "pre-book tickets",
            "pre book tickets",
            "prebook tickets"
        ]

        # Check if any of the phrases are found in the page content
        for phrase in check_phrases:
            if phrase in page_content:
                print(f"🔔 '{phrase}' found!")
                return True  # Condition met
        
        print("No relevant phrase found. Will check again.")
        return False  # Condition not met
    except Exception as e:
        print("Error checking page:", e)
        return False  # In case of an error, return False

def main():
    driver = setup_stealth_driver()
    in_cinemas_found = False  # Flag to track if any of the phrases are found

    try:
        while True:
            # If any phrase has been found, send notifications continuously
            if in_cinemas_found:
                print("🎬 Relevant phrase found. Sending notifications every 7 seconds.")
                # Keep sending notifications every 7 seconds in a non-blocking way
                while in_cinemas_found:
                    send_notification()
                    time.sleep(7)  # 7-second interval notifications

            else:
                # Check if any relevant phrase is found
                in_cinemas_found = check_page_for_text(driver)

                if in_cinemas_found:
                    print("🎬 Relevant phrase found. Notifications will now run indefinitely.")
                    # Do not proceed to sleep or further checks after this

                # Sleep for a random duration before checking again, only if no relevant phrase is found
                if not in_cinemas_found:
                    wait_minutes = random.uniform(2, 6)  # Random wait time between 2 and 6 minutes
                    print(f"Sleeping for {wait_minutes:.2f} minutes...\n")
                    time.sleep(wait_minutes * 60)

    finally:
        driver.quit()

if __name__ == "__main__":
    main()
