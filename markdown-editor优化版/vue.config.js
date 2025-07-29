module.exports = {
  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.js$/,
          include: [
            /node_modules\/marked/,
          ],
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', { 
                  targets: { 
                    browsers: ['> 1%', 'last 2 versions'] 
                  } 
                }]
              ]
            }
          }
        }
      ]
    },
    performance: {
      hints: false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
    }
  },
  chainWebpack: (config) => {
    config.optimization.splitChunks({
      chunks: 'all',
      maxSize: 244 * 1024 // 244 KiB
    });
  },
  publicPath: './',
};
