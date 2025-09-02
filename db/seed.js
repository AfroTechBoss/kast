const { pool } = require('./connection');
const { v4: uuidv4 } = require('uuid');

// Sample users data
const sampleUsers = [
  {
    farcaster_id: 12345,
    username: 'alice_crypto',
    display_name: 'Alice Cooper',
    bio: 'Crypto enthusiast and meme creator',
    avatar_url: 'https://i.imgur.com/avatar1.jpg',
    wallet_address: '0x1234567890123456789012345678901234567890',
    follower_count: 1250,
    following_count: 890,
    account_created_at: new Date('2023-01-15'),
    is_verified: true,
    total_score: 2450
  },
  {
    farcaster_id: 67890,
    username: 'bob_builder',
    display_name: 'Bob the Builder',
    bio: 'Building the future of Web3',
    avatar_url: 'https://i.imgur.com/avatar2.jpg',
    wallet_address: '0x2345678901234567890123456789012345678901',
    follower_count: 890,
    following_count: 1200,
    account_created_at: new Date('2023-02-20'),
    is_verified: false,
    total_score: 1890
  },
  {
    farcaster_id: 11111,
    username: 'charlie_dev',
    display_name: 'Charlie Dev',
    bio: 'Full-stack developer and DeFi lover',
    avatar_url: 'https://i.imgur.com/avatar3.jpg',
    wallet_address: '0x3456789012345678901234567890123456789012',
    follower_count: 2100,
    following_count: 750,
    account_created_at: new Date('2023-03-10'),
    is_verified: true,
    total_score: 3200
  }
];

// Sample campaigns data
const sampleCampaigns = [
  {
    title: 'DeFi Summer Meme Contest',
    description: 'Create the best DeFi memes and win USDC rewards!',
    rules: 'Create original memes about DeFi protocols. No offensive content. Must include #DeFiSummer hashtag.',
    reward_pool: 5000.00,
    reward_token_symbol: 'USDC',
    reward_token_address: '0xA0b86a33E6441b8dB4B2b8b8b8b8b8b8b8b8b8b8',
    start_time: new Date('2024-01-01'),
    end_time: new Date('2024-02-01'),
    status: 'active'
  },
  {
    title: 'Base Chain Explainer Challenge',
    description: 'Explain Base Chain features in simple terms',
    rules: 'Create educational content about Base Chain. Must be beginner-friendly and accurate.',
    reward_pool: 3000.00,
    reward_token_symbol: 'ETH',
    reward_token_address: '0x0000000000000000000000000000000000000000',
    start_time: new Date('2024-01-15'),
    end_time: new Date('2024-02-15'),
    status: 'active'
  },
  {
    title: 'NFT Art Showcase',
    description: 'Share your best NFT creations',
    rules: 'Original NFT artwork only. Must be your own creation. Include creation process.',
    reward_pool: 2500.00,
    reward_token_symbol: 'USDC',
    reward_token_address: '0xA0b86a33E6441b8dB4B2b8b8b8b8b8b8b8b8b8b8',
    start_time: new Date('2023-12-01'),
    end_time: new Date('2023-12-31'),
    status: 'ended'
  }
];

// Sample campaign tasks
const sampleTasks = [
  {
    task_type: 'meme',
    title: 'Create DeFi Meme',
    description: 'Create an original meme about DeFi protocols',
    points: 100,
    max_submissions: 3,
    is_required: true,
    order_index: 1
  },
  {
    task_type: 'cast',
    title: 'Share Your Meme',
    description: 'Post your meme on Farcaster with #DeFiSummer',
    points: 50,
    max_submissions: 5,
    is_required: true,
    order_index: 2
  },
  {
    task_type: 'explainer',
    title: 'Explain Base Features',
    description: 'Create educational content about Base Chain',
    points: 150,
    max_submissions: 2,
    is_required: true,
    order_index: 1
  }
];

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting database seeding...');
    
    await client.query('BEGIN');
    
    // Clear existing data (in reverse order of dependencies)
    console.log('🧹 Clearing existing seed data...');
    await client.query('DELETE FROM user_badges WHERE user_id IN (SELECT id FROM users WHERE username LIKE \'%_crypto\' OR username LIKE \'%_builder\' OR username LIKE \'%_dev\')');
    await client.query('DELETE FROM rewards WHERE user_id IN (SELECT id FROM users WHERE username LIKE \'%_crypto\' OR username LIKE \'%_builder\' OR username LIKE \'%_dev\')');
    await client.query('DELETE FROM submissions WHERE user_id IN (SELECT id FROM users WHERE username LIKE \'%_crypto\' OR username LIKE \'%_builder\' OR username LIKE \'%_dev\')');
    await client.query('DELETE FROM campaign_tasks WHERE campaign_id IN (SELECT id FROM campaigns WHERE title LIKE \'%Contest%\' OR title LIKE \'%Challenge%\' OR title LIKE \'%Showcase%\')');
    await client.query('DELETE FROM campaign_participants WHERE user_id IN (SELECT id FROM users WHERE username LIKE \'%_crypto\' OR username LIKE \'%_builder\' OR username LIKE \'%_dev\')');
    await client.query('DELETE FROM campaigns WHERE title LIKE \'%Contest%\' OR title LIKE \'%Challenge%\' OR title LIKE \'%Showcase\'');
    await client.query('DELETE FROM users WHERE username LIKE \'%_crypto\' OR username LIKE \'%_builder\' OR username LIKE \'%_dev\'');
    
    // Insert users
    console.log('👥 Inserting sample users...');
    const userIds = [];
    for (const user of sampleUsers) {
      const userId = uuidv4();
      userIds.push(userId);
      
      await client.query(`
        INSERT INTO users (
          id, farcaster_id, username, display_name, bio, avatar_url, 
          wallet_address, follower_count, following_count, account_created_at, 
          is_verified, total_score
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        userId, user.farcaster_id, user.username, user.display_name, 
        user.bio, user.avatar_url, user.wallet_address, user.follower_count,
        user.following_count, user.account_created_at, user.is_verified, user.total_score
      ]);
    }
    
    // Insert campaigns
    console.log('🎯 Inserting sample campaigns...');
    const campaignIds = [];
    for (let i = 0; i < sampleCampaigns.length; i++) {
      const campaign = sampleCampaigns[i];
      const campaignId = uuidv4();
      campaignIds.push(campaignId);
      
      await client.query(`
        INSERT INTO campaigns (
          id, creator_id, title, description, rules, reward_pool, 
          reward_token_symbol, reward_token_address, start_time, end_time, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        campaignId, userIds[0], campaign.title, campaign.description, 
        campaign.rules, campaign.reward_pool, campaign.reward_token_symbol,
        campaign.reward_token_address, campaign.start_time, campaign.end_time, campaign.status
      ]);
    }
    
    // Insert campaign tasks
    console.log('📋 Inserting sample campaign tasks...');
    const taskIds = [];
    for (let i = 0; i < sampleTasks.length; i++) {
      const task = sampleTasks[i];
      const taskId = uuidv4();
      taskIds.push(taskId);
      
      // Assign tasks to campaigns
      const campaignId = i < 2 ? campaignIds[0] : campaignIds[1];
      
      await client.query(`
        INSERT INTO campaign_tasks (
          id, campaign_id, task_type, title, description, points, 
          max_submissions, is_required, order_index
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        taskId, campaignId, task.task_type, task.title, task.description,
        task.points, task.max_submissions, task.is_required, task.order_index
      ]);
    }
    
    // Insert campaign participants
    console.log('🏃 Inserting campaign participants...');
    for (const campaignId of campaignIds.slice(0, 2)) { // Only active campaigns
      for (const userId of userIds) {
        const participantId = uuidv4();
        const totalScore = Math.floor(Math.random() * 500) + 100;
        
        await client.query(`
          INSERT INTO campaign_participants (
            id, campaign_id, user_id, total_score, submission_count, 
            joined_at, is_eligible
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          participantId, campaignId, userId, totalScore, 
          Math.floor(Math.random() * 5) + 1, 
          new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
          true
        ]);
      }
    }
    
    // Insert sample submissions
    console.log('📝 Inserting sample submissions...');
    const submissions = [
      {
        content: 'Check out this hilarious DeFi meme! 🚀 #DeFiSummer',
        content_type: 'meme',
        like_count: 45,
        recast_count: 12,
        reply_count: 8,
        status: 'approved'
      },
      {
        content: 'Base Chain explained in simple terms: It\'s like Ethereum but faster and cheaper! 💡',
        content_type: 'explainer',
        like_count: 78,
        recast_count: 23,
        reply_count: 15,
        status: 'approved'
      },
      {
        content: 'My latest NFT creation - what do you think? 🎨',
        content_type: 'cast',
        like_count: 34,
        recast_count: 7,
        reply_count: 12,
        status: 'pending'
      }
    ];
    
    for (let i = 0; i < submissions.length; i++) {
      const submission = submissions[i];
      const submissionId = uuidv4();
      const campaignId = campaignIds[i % 2]; // Alternate between first two campaigns
      const userId = userIds[i % userIds.length];
      
      // Get participant ID
      const participantResult = await client.query(
        'SELECT id FROM campaign_participants WHERE campaign_id = $1 AND user_id = $2',
        [campaignId, userId]
      );
      
      if (participantResult.rows.length > 0) {
        const participantId = participantResult.rows[0].id;
        const engagementScore = (submission.like_count * 1.0) + 
                               (submission.recast_count * 2.0) + 
                               (submission.reply_count * 1.5);
        
        await client.query(`
          INSERT INTO submissions (
            id, campaign_id, participant_id, user_id, content_type, content,
            like_count, recast_count, reply_count, engagement_score,
            base_points, total_points, status, submitted_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `, [
          submissionId, campaignId, participantId, userId, submission.content_type,
          submission.content, submission.like_count, submission.recast_count,
          submission.reply_count, engagementScore, 100, 100 + Math.floor(engagementScore),
          submission.status, new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        ]);
      }
    }
    
    // Award some badges to users
    console.log('🏆 Awarding sample badges...');
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      const badgeIds = [1, 2, 3]; // First Cast, Engagement Master, Top Performer
      
      for (let j = 0; j <= i; j++) { // Give more badges to later users
        if (badgeIds[j]) {
          await client.query(`
            INSERT INTO user_badges (id, user_id, badge_id, earned_at)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, badge_id, campaign_id) DO NOTHING
          `, [
            uuidv4(), userId, badgeIds[j], 
            new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
          ]);
        }
      }
    }
    
    await client.query('COMMIT');
    console.log('✅ Database seeding completed successfully!');
    
    // Display summary
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM campaigns) as campaigns_count,
        (SELECT COUNT(*) FROM campaign_participants) as participants_count,
        (SELECT COUNT(*) FROM submissions) as submissions_count,
        (SELECT COUNT(*) FROM user_badges) as badges_count
    `);
    
    console.log('\n📊 Database Summary:');
    console.log(`   Users: ${stats.rows[0].users_count}`);
    console.log(`   Campaigns: ${stats.rows[0].campaigns_count}`);
    console.log(`   Participants: ${stats.rows[0].participants_count}`);
    console.log(`   Submissions: ${stats.rows[0].submissions_count}`);
    console.log(`   User Badges: ${stats.rows[0].badges_count}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Database seeding failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { seedDatabase };

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}