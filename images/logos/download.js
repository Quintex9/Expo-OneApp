const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const logos = [
  {
    name: 'tesco.png',
    url: 'https://cdn.worldvectorlogo.com/logos/tesco-1.svg'
  },
  {
    name: 'billa.png',  
    url: 'https://cdn.worldvectorlogo.com/logos/billa.svg'
  },
  {
    name: 'dm.png',
    url: 'https://cdn.worldvectorlogo.com/logos/dm-drogerie-markt.svg'
  }
];

const downloadFile = (url, filename) => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, filename);
    const file = fs.createWriteStream(filePath);
    const protocol = url.startsWith('https') ? https : http;
    
    const request = (urlToFetch, redirectCount = 0) => {
      if (redirectCount > 5) {
        reject(new Error('Too many redirects'));
        return;
      }
      
      protocol.get(urlToFetch, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/png,image/*,*/*',
        }
      }, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
          const newUrl = response.headers.location;
          console.log(`Redirect ${filename}: ${newUrl}`);
          request(newUrl, redirectCount + 1);
          return;
        }
        
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode} for ${filename}`));
          return;
        }

        const contentType = response.headers['content-type'] || '';
        if (!contentType.includes('image')) {
          reject(new Error(`Not an image: ${contentType} for ${filename}`));
          return;
        }
        
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✓ Downloaded: ${filename}`);
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(filePath, () => {});
        reject(err);
      });
    };
    
    request(url);
  });
};

async function main() {
  console.log('Downloading logos...\n');
  
  for (const logo of logos) {
    try {
      await downloadFile(logo.url, logo.name);
    } catch (err) {
      console.error(`✗ Failed ${logo.name}: ${err.message}`);
    }
  }
  
  console.log('\nDone!');
}

main();
