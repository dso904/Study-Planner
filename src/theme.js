import { createTheme, rem } from '@mantine/core';

const theme = createTheme({
    primaryColor: 'cyber',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    fontFamilyMonospace: '"JetBrains Mono", monospace',
    headings: {
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
        fontWeight: '600',
    },
    radius: {
        xs: rem(4),
        sm: rem(6),
        md: rem(8),
        lg: rem(12),
        xl: rem(16),
    },
    shadows: {
        xs: '0 0 4px rgba(167, 139, 250, 0.12)',
        sm: '0 0 8px rgba(167, 139, 250, 0.15)',
        md: '0 0 20px rgba(167, 139, 250, 0.18)',
        lg: '0 0 40px rgba(167, 139, 250, 0.2)',
        xl: '0 0 60px rgba(167, 139, 250, 0.25)',
    },
    colors: {
        // Cyber violet — primary
        cyber: [
            '#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7',
            '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95',
        ],
        // Neon pink / red accent
        neonPink: [
            '#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899',
            '#db2777', '#be185d', '#9d174d', '#831843', '#500724',
        ],
        // Electric cyan — secondary
        electric: [
            '#ecfeff', '#cffafe', '#a5f3fc', '#67e8f9', '#22d3ee',
            '#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63',
        ],
        // Void — dark backgrounds
        void: [
            '#1e1b4b', '#1a1744', '#15123d', '#110f36', '#0d0b2e',
            '#0a0820', '#080618', '#060512', '#04030c', '#020206',
        ],
        // Plasma orange accent
        plasma: [
            '#fff7ed', '#ffedd5', '#fed7aa', '#fdba74', '#fb923c',
            '#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12',
        ],
    },
    components: {
        Button: {
            defaultProps: { radius: 'md' },
            styles: {
                root: {
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                },
            },
        },
        Card: {
            defaultProps: { radius: 'lg', withBorder: true },
            styles: {
                root: {
                    backgroundColor: 'rgba(22, 18, 56, 0.8)',
                    borderColor: 'rgba(167, 139, 250, 0.2)',
                    backdropFilter: 'blur(12px)',
                },
            },
        },
        Modal: {
            defaultProps: {
                radius: 'lg',
                centered: true,
                overlayProps: { backgroundOpacity: 0.7, blur: 8, color: '#0b0920' },
            },
            styles: {
                content: {
                    backgroundColor: '#151238',
                    border: '1px solid rgba(167, 139, 250, 0.25)',
                },
                header: {
                    backgroundColor: '#151238',
                },
            },
        },
        TextInput: {
            defaultProps: { radius: 'md' },
            styles: {
                input: {
                    backgroundColor: 'rgba(18, 14, 48, 0.7)',
                    borderColor: 'rgba(167, 139, 250, 0.25)',
                    color: '#f1f5f9',
                    '&:focus': { borderColor: '#a78bfa' },
                },
            },
        },
        Select: {
            defaultProps: { radius: 'md' },
            styles: {
                input: {
                    backgroundColor: 'rgba(18, 14, 48, 0.7)',
                    borderColor: 'rgba(167, 139, 250, 0.25)',
                    color: '#f1f5f9',
                },
                dropdown: {
                    backgroundColor: '#1a1742',
                    borderColor: 'rgba(167, 139, 250, 0.25)',
                },
            },
        },
        Textarea: {
            defaultProps: { radius: 'md' },
            styles: {
                input: {
                    backgroundColor: 'rgba(18, 14, 48, 0.7)',
                    borderColor: 'rgba(167, 139, 250, 0.25)',
                    color: '#f1f5f9',
                },
            },
        },
        SegmentedControl: {
            styles: {
                root: {
                    backgroundColor: 'rgba(10, 8, 32, 0.6)',
                },
            },
        },
        NumberInput: {
            styles: {
                input: {
                    backgroundColor: 'rgba(10, 8, 32, 0.6)',
                    borderColor: 'rgba(139, 92, 246, 0.2)',
                    color: '#e2e8f0',
                },
            },
        },
    },
});

export default theme;
