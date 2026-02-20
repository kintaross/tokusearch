/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://tokusearch.vercel.app',
  generateRobotsTxt: true,
  // optional
  // robotsTxtOptions: {
  //   additionalSitemaps: [
  //     'https://tokusearch.vercel.app/server-sitemap.xml', // <==== Add this
  //   ],
  // },
}
