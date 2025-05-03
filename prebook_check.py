import time
import random
import undetected_chromedriver as uc
from plyer import notification
import traceback
import sys

BOOKMYSHOW_URL = "https://in.bookmyshow.com/movies/kochi/mission-impossible-the-final-reckoning/ET00419530"

def setup_stealth_driver():
    options = uc.ChromeOptions()
    options.headless = False
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--disable-infobars")
    options.add_argument("--disable-extensions")
    options.add_argument("--disable-gpu")
    options.add_argument("--start-maximized")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
    return uc.Chrome(options=options)

def send_notification():
    try:
        notification.notify(
            title="BOOK TICKET NOW",
            message="🎬 'In cinemas' found on BookMyShow page.",
            timeout=10
        )
    except Exception:
        handle_global_exception(sys.exc_info())

def send_error_notification():
    try:
        notification.notify(
            title="❌ ERROR: PLEASE CHECK",
            message="Something went wrong. See terminal for details.",
            timeout=10
        )
    except:
        pass  # Avoid recursive notification failure
def check_page_for_text(driver):
    try:
        driver.get(BOOKMYSHOW_URL)
        time.sleep(8)
        try:
            page_content = driver.page_source.lower()
        except Exception as e:
            # Handle session-related disconnection explicitly
            error_text = str(e).lower()
            if any(keyword in error_text for keyword in [
                "invalid session id", "chrome not reachable", "disconnected", "no such window"
            ]):
                raise RuntimeError("BROWSER_CLOSED")


        check_phrases = [
            "in cinemas", "book tickets", "pre-book tickets",
            "pre book tickets", "prebook tickets", "book ticket",
            "pre-book ticket", "pre book ticket", "prebook ticket"
        ]
        for phrase in check_phrases:
            if phrase in page_content:
                print(f"🔔 '{phrase}' found!")
                return True
        print("No relevant phrase found. Will check again.")
        return False
    except RuntimeError:
        raise
    except Exception:
        handle_global_exception(sys.exc_info())
        return False

def main():
    driver = None
    in_cinemas_found = False

    while True:
        try:
            if driver is None:
                print("🚀 Starting new Chrome session...")
                driver = setup_stealth_driver()

            if in_cinemas_found:
                print("🎬 Phrase found. Sending notifications every 7 seconds.")
                notification_counter = 0
                while in_cinemas_found:
                    try:
                        send_notification()
                        time.sleep(7)
                        notification_counter += 1

                        if notification_counter % 5 == 0:
                            in_cinemas_found = check_page_for_text(driver)

                    except RuntimeError as err:
                        if str(err) == "BROWSER_CLOSED":
                            raise
                        else:
                            handle_global_exception(sys.exc_info())
                    except Exception:
                        handle_global_exception(sys.exc_info())

            else:
                in_cinemas_found = check_page_for_text(driver)
                if in_cinemas_found:
                    print("🎬 Phrase found. Notification loop will now run.")
                else:
                    wait_minutes = random.uniform(2, 6)
                    print(f"Sleeping for {wait_minutes:.2f} minutes...\n")
                    time.sleep(wait_minutes * 60)

        except RuntimeError as err:
            if str(err) == "BROWSER_CLOSED":
                print("❌ Browser was closed. Restarting Chrome driver...\n")
                send_error_notification()
                try:
                    driver.quit()
                except:
                    pass
                driver = None
                in_cinemas_found = False
                time.sleep(3)
                continue

        except Exception:
            handle_global_exception(sys.exc_info())
            try:
                driver.quit()
            except:
                pass
            driver = None
            in_cinemas_found = False
            time.sleep(5)


def handle_global_exception(exc_info):
    print("❌ ERROR OCCURRED:")
    traceback.print_exception(*exc_info)
    send_error_notification()

if __name__ == "__main__":
    try:
        main()
    except Exception:
        handle_global_exception(sys.exc_info())
