const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// TikTok API configuration
const TIKWM_API = {
    host: "https://www.tikwm.com",
    endpoints: {
        userInfo: "/api/user/info",
        userVideos: "/api/user/posts",
        search: "/api/feed/search"
    }
};

// Helper function to build API URL
const buildApiUrl = (endpoint, params = {}) => {
    const url = new URL(TIKWM_API.host + endpoint);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    return url.toString();
};

// Get user profile endpoint
app.get('/api/tiktok/user', async (req, res) => {
    try {
        const { username } = req.query;
        if (!username) return res.status(400).json({ success: false, message: 'Please provide a TikTok username' });

        const apiUrl = buildApiUrl(TIKWM_API.endpoints.userInfo, { unique_id: username });
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (data.code !== 0) throw new Error(data.msg || 'Failed to fetch user information');

        const cleanData = {
            id: data.data.user.id,
            username: data.data.user.uniqueId,
            nickname: data.data.user.nickname,
            avatar: data.data.user.avatarLarger,
            verified: data.data.user.verified,
            bio: data.data.user.signature,
            stats: {
                following: data.data.stats.followingCount,
                followers: data.data.stats.followerCount,
                likes: data.data.stats.heartCount,
                videos: data.data.stats.videoCount
            }
        };

        return res.json(cleanData);
    } catch (error) {
        console.error('Error:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to fetch TikTok user information', error: error.message });
    }
});

// Get user videos endpoint
app.get('/api/tiktok/user/videos', async (req, res) => {
    try {
        const { username } = req.query;
        if (!username) return res.status(400).json({ success: false, message: 'Please provide a TikTok username' });

        const apiUrl = buildApiUrl(TIKWM_API.endpoints.userVideos, { unique_id: username });
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (data.code !== 0) throw new Error(data.msg || 'Failed to fetch user videos');

        const cleanData = data.data.videos.map(video => ({
            id: video.video_id,
            title: video.title,
            duration: video.duration,
            cover: video.cover,
            origin_cover: video.origin_cover,
            ai_dynamic_cover: video.ai_dynamic_cover,
            play: video.play,
            music: video.music,
            music_info: {
                id: video.music_info.id,
                title: video.music_info.title,
                play: video.music_info.play,
                cover: video.music_info.cover,
                author: video.music_info.author
            },
            stats: {
                playCount: video.play_count,
                diggCount: video.digg_count,
                commentCount: video.comment_count,
                shareCount: video.share_count,
                downloadCount: video.download_count
            },
            createTime: video.create_time
        }));

        return res.json(cleanData);
    } catch (error) {
        console.error('Error:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to fetch user videos', error: error.message });
    }
});

// TikTok search endpoint (FIXED: using "keywords" not "keyword")
app.get('/api/tiktok/search', async (req, res) => {
    try {
        const { keyword } = req.query;
        if (!keyword) return res.status(400).json({ success: false, message: 'Please provide a search keyword' });

        const apiUrl = buildApiUrl(TIKWM_API.endpoints.search, { keywords: keyword });
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (data.code !== 0) throw new Error(data.msg || 'Failed to search TikTok videos');

        const cleanData = data.data.videos.map(video => ({
            id: video.video_id,
            title: video.title,
            duration: video.duration,
            cover: video.cover,
            origin_cover: video.origin_cover,
            ai_dynamic_cover: video.ai_dynamic_cover,
            play: video.play,
            music: video.music,
            music_info: {
                id: video.music_info.id,
                title: video.music_info.title,
                play: video.music_info.play,
                cover: video.music_info.cover,
                author: video.music_info.author
            },
            stats: {
                playCount: video.play_count,
                diggCount: video.digg_count,
                commentCount: video.comment_count,
                shareCount: video.share_count,
                downloadCount: video.download_count
            },
            createTime: video.create_time
        }));

        return res.json(cleanData);
    } catch (error) {
        console.error('Error:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to search TikTok videos', error: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', version: '1.0.0', api: 'tikwm.com' });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log('Using tikwm.com API');
});
