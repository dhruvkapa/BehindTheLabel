Place your downloaded background video here as `hero.mp4`.
Recommended command (see project README or below):

yt-dlp -f best -o "videos/hero.%(ext)s" "https://www.youtube.com/watch?v=bZdWKxLCYQw"

If the downloaded format is not MP4, convert with ffmpeg:
ffmpeg -i videos/hero.webm -c:v libx264 -crf 23 -preset medium -c:a aac videos/hero.mp4
