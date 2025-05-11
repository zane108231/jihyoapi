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
        userVideos: "/api/user/posts"
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
        
        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a TikTok username'
            });
        }

        const apiUrl = buildApiUrl(TIKWM_API.endpoints.userInfo, { unique_id: username });
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (data.code !== 0) {
            throw new Error(data.msg || 'Failed to fetch user information');
        }

        // Clean up the response to only include what's needed
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
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch TikTok user information',
            error: error.message
        });
    }
});

// Get user videos endpoint
app.get('/api/tiktok/user/videos', async (req, res) => {
    try {
        const { username } = req.query;
        
        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a TikTok username'
            });
        }

        const apiUrl = buildApiUrl(TIKWM_API.endpoints.userVideos, { unique_id: username });
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (data.code !== 0) {
            throw new Error(data.msg || 'Failed to fetch user videos');
        }

        // Clean up the response to only include what's needed
        const cleanData = data.data.videos.map(video => ({
            id: video.video_id,
            title: video.title,
            noWatermarkUrl: video.wmplay,
            stats: {
                playCount: video.play_count,
                diggCount: video.digg_count,
                commentCount: video.comment_count,
                shareCount: video.share_count,
                collectCount: video.collect_count
            },
            createTime: video.create_time
        }));

        return res.json(cleanData);

    } catch (error) {
        console.error('Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch user videos',
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        version: '1.0.0',
        api: 'tikwm.com'
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log('Using tikwm.com API');
}); 