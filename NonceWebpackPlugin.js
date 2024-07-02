const crypto = require('crypto');

class NonceWebpackPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('NonceWebpackPlugin', (compilation) => {
      compilation.hooks.htmlWebpackPluginAlterAssetTags.tapAsync('NonceWebpackPlugin', (data, cb) => {
        const nonce = crypto.randomBytes(16).toString('base64');
        data.head.forEach(tag => {
          if (tag.tagName === 'script') {
            tag.attributes.nonce = nonce;
          }
        });
        data.body.forEach(tag => {
          if (tag.tagName === 'script') {
            tag.attributes.nonce = nonce;
          }
        });
        cb(null, data);
      });

      compilation.hooks.htmlWebpackPluginBeforeHtmlProcessing.tapAsync('NonceWebpackPlugin', (data, cb) => {
        const nonce = crypto.randomBytes(16).toString('base64');
        data.html = data.html.replace(/<script>/g, `<script nonce="${nonce}">`);
        data.html = data.html.replace(/window\.__nonce__ = '';/, `window.__nonce__ = '${nonce}';`);
        cb(null, data);
      });
    });
  }
}

module.exports = NonceWebpackPlugin;
