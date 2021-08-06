/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const darkCodeTheme = require('prism-react-renderer/themes/dracula')
const lightCodeTheme = require('prism-react-renderer/themes/github')

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
    title: 'Mutoid',
    tagline: 'Reactive library for data fetching, caching, state management (also) for isomorphic applications',
    url: 'https://engineering.facile.it',
    baseUrl: '/mutoid/',
    onBrokenLinks: 'throw',
    onBrokenMarkdownLinks: 'warn',
    favicon: 'img/favicon.ico',
    organizationName: 'facile-it',
    projectName: 'mutoid',
    trailingSlash: false,
    themeConfig: {
        navbar: {
            title: 'Mutoid',
            logo: {
                alt: 'Mutoid: Reactive library for data fetching, caching, state management',
                src: 'img/logo.svg',
            },
            items: [
                {
                    type: 'doc',
                    docId: 'getting-started',
                    position: 'left',
                    label: 'Docs',
                },
                { to: '/blog', label: 'Blog', position: 'left' },
                {
                    href: 'https://www.npmjs.com/package/mutoid',
                    label: 'npm',
                    position: 'right',
                },
                {
                    href: 'https://github.com/facile-it/mutoid',
                    label: 'GitHub',
                    position: 'right',
                },
            ],
        },
        footer: {
            style: 'dark',
            links: [
                {
                    title: 'Reference',
                    items: [
                        {
                            label: 'Docs',
                            to: '/docs/getting-started',
                        },
                        {
                            label: 'Blog',
                            to: '/blog',
                        },
                    ],
                },
                {
                    title: 'Github',
                    items: [
                        {
                            label: 'Facile.it',
                            href: 'https://github.com/facile-it',
                        },
                        {
                            label: 'Mutoid',
                            href: 'https://github.com/facile-it/mutoid',
                        },
                        {
                            label: 'Changelog',
                            href: 'https://github.com/facile-it/mutoid/blob/master/CHANGELOG.md',
                        },
                    ],
                },
                {
                    title: 'Community',
                    items: [
                        {
                            label: 'Twitter',
                            href: 'https://twitter.com/FacileIt_Engr',
                        },
                        {
                            label: 'Blog Facile.it Engineering',
                            href: 'https://engineering.facile.it/',
                        },
                        {
                            label: 'Linkedin',
                            href: 'https://www.linkedin.com/company/facile-it/mycompany/',
                        },
                    ],
                },
            ],
            copyright: `Copyright © ${new Date().getFullYear()} Facile.it Engineering, Built with Docusaurus.`,
        },
        prism: {
            theme: lightCodeTheme,
            darkTheme: darkCodeTheme,
        },
    },
    presets: [
        [
            '@docusaurus/preset-classic',
            {
                docs: {
                    sidebarPath: require.resolve('./sidebars.js'),
                    editUrl: 'https://github.com/facile-it/mutoid/edit/master/website',
                },
                blog: {
                    showReadingTime: true,
                    editUrl: 'https://github.com/facebook/docusaurus/edit/master/website/blog/',
                },
                theme: {
                    customCss: require.resolve('./src/css/custom.css'),
                },
            },
        ],
    ],
}
