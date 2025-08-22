import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
import time
from textblob import TextBlob

# Function to extract YouTube video ID from URL
def get_video_id(url):
    if 'v=' in url:
        return url.split('v=')[1].split('&')[0]
    elif 'youtu.be/' in url:
        return url.split('youtu.be/')[1].split('?')[0]
    return None

# Function to scrape YouTube comments
def scrape_youtube_comments(video_url):
    video_id = get_video_id(video_url)
    if not video_id:
        return []
    
    driver = webdriver.Chrome()  # Ensure the WebDriver is in your PATH
    driver.get(f"https://www.youtube.com/watch?v={video_id}")
    time.sleep(5)
    
    action = ActionChains(driver)
    for _ in range(20):  # Adjust the range to load more comments
        action.send_keys(Keys.PAGE_DOWN).perform()
        time.sleep(1)
    
    comments = driver.find_elements(By.XPATH, '//*[@id="content-text"]')
    comment_list = [comment.text for comment in comments]
    
    driver.quit()
    return comment_list

# Function to perform sentiment analysis
def analyze_sentiment(comments):
    if not comments:
        return 0.0
    total_sentiment = 0.0
    for comment in comments:
        analysis = TextBlob(comment)
        total_sentiment += analysis.sentiment.polarity
    return total_sentiment / len(comments)

# Read data from CSV
df = pd.read_csv("cdatanew.csv")

# Analyze each row and calculate "Our Rating"
our_ratings = []
for index, row in df.iterrows():
    s_link = row["S links"]
    if isinstance(s_link, str) and ("youtu.be" in s_link or "youtube.com" in s_link):
        comments = scrape_youtube_comments(s_link)
        our_rating = analyze_sentiment(comments)
    else:
        our_rating = "n/a"
    our_ratings.append(our_rating)

df["Our Rating"] = our_ratings

# Save to CSV
df.to_csv("colleges_with_ratings.csv", index=False)

# Print DataFrame
print(df)
