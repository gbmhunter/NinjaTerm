import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import { useEffect, useState } from 'react';
import styles from './index.module.css';
import Grid from '@mui/material/Grid';
import { Typography, Button, Box, CircularProgress } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import TerminalIcon from '@mui/icons-material/Terminal';
import InfoIcon from '@mui/icons-material/Info';
import GitHubIcon from '@mui/icons-material/GitHub';

// Static imports for assets
const WindowsLogoPng = '/img/windows-logo.png';
const LinuxLogoPng = '/img/linux-logo.png';
const MacLogoPng = '/img/mac-logo.png';
const GitHubReadmeLogoPng = '/img/github-readme-logo.png';
const AnsiEscapeCodeColoursWebM = '/img/ansi-escape-code-colours.webm';
const GraphingWebM = '/img/graphing.webm';
const SmartScrollWebM = '/img/smart-scroll.webm';
const ControlCharAndHexCodeGlyphsWebM = '/img/control-char-and-hex-code-glyphs.webm';
const LoggingWebM = '/img/logging.webm';
const FilteringWebM = '/img/filtering.webm';
const NumberTypesWebM = '/img/number-types.webm';

interface GitHubAsset {
  name: string;
  browser_download_url: string;
}

interface GitHubRelease {
  tag_name: string;
  assets: GitHubAsset[];
}

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  const [release, setRelease] = useState<GitHubRelease | null>(null);
  const [loading, setLoading] = useState(false);
  const [userPlatform, setUserPlatform] = useState<{ os: string; arch: string } | null>(null);

  useEffect(() => {
    // Detect user's platform and architecture
    const detectPlatform = () => {
      const userAgent = navigator.userAgent;
      let os = '';
      let arch = '';

      // Detect OS
      if (userAgent.includes('Win')) {
        os = 'win';
      } else if (userAgent.includes('Mac')) {
        os = 'mac';
      } else if (userAgent.includes('Linux')) {
        os = 'linux';
      }

      // Detect architecture
      if (userAgent.includes('x86_64') || userAgent.includes('Win64') || userAgent.includes('WOW64')) {
        arch = 'x64';
      } else if (userAgent.includes('arm64') || userAgent.includes('aarch64')) {
        arch = 'arm64';
      } else if (userAgent.includes('Intel Mac')) {
        arch = 'x64';
      } else if (os === 'mac' && !userAgent.includes('Intel')) {
        // Modern Macs without Intel in user agent are likely Apple Silicon
        arch = 'arm64';
      } else if (os === 'win' || os === 'linux') {
        // Default to x64 for Windows/Linux if unclear
        arch = 'x64';
      }

      // Only set platform if we have both OS and arch
      if (os && arch) {
        setUserPlatform({ os, arch });
      }
    };

    // Fetch latest release data
    const fetchLatestRelease = async () => {
      setLoading(true);
      try {
        const response = await fetch('https://api.github.com/repos/gbmhunter/NinjaTerm/releases/latest');
        if (response.ok) {
          const releaseData = await response.json();
          setRelease(releaseData);
        }
      } catch (error) {
        console.error('Failed to fetch release data:', error);
      } finally {
        setLoading(false);
      }
    };

    detectPlatform();
    fetchLatestRelease();
  }, []);

  // Helper functions to get download URLs
  const getPlatformDownloadUrl = (os: string, arch: string) => {
    if (!release) return null;

    if (os === 'win' && arch === 'x64') {
      const windowsAsset = release.assets.find((asset) => asset.name.includes('Setup') && asset.name.includes('x64') && asset.name.endsWith('.exe'));
      return windowsAsset?.browser_download_url || null;
    }

    if (os === 'mac') {
      const macAsset = release.assets.find((asset) => asset.name.endsWith('.dmg') && (arch === 'arm64' ? asset.name.includes('arm64') : asset.name.includes('x64')));
      return macAsset?.browser_download_url || null;
    }

    if (os === 'linux') {
      const linuxAsset = release.assets.find(
        (asset) => asset.name.endsWith('.AppImage') && (arch === 'arm64' ? asset.name.includes('arm64') : asset.name.includes('x64') || asset.name.includes('x86_64'))
      );
      return linuxAsset?.browser_download_url || null;
    }

    return null;
  };

  const getPlatformLabel = (os: string, arch: string) => {
    const osLabels: { [key: string]: string } = {
      win: 'Windows',
      mac: 'macOS',
      linux: 'Linux',
    };
    const archLabels: { [key: string]: string } = {
      x64: 'x64',
      arm64: 'ARM64',
    };
    return `${osLabels[os]} (${archLabels[arch]})`;
  };

  const getPlatformIcon = (os: string) => {
    if (os === 'win') {
      return <img src={WindowsLogoPng} alt="Windows" className={styles.platformIcon} />;
    }
    if (os === 'linux') {
      return <img src={LinuxLogoPng} alt="Linux" className={styles.platformIcon} />;
    }
    if (os === 'mac') {
      return <img src={MacLogoPng} alt="macOS" className={styles.platformIcon} />;
    }
    return '📥';
  };

  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <div className={styles.logoContainer}>
          <img src={GitHubReadmeLogoPng} alt="NinjaTerm logo" className={styles.heroLogo} />
        </div>

        <h1 className={clsx(styles.tagline)}>
          A serial port terminal that's got your back.
          <span className={styles.cursor}>&nbsp;</span>
        </h1>

        <div className={styles.buttons}>
          {loading ? (
            <div className={styles.loading}>Loading latest release...</div>
          ) : (
            <>
              {userPlatform && getPlatformDownloadUrl(userPlatform.os, userPlatform.arch) && (
                <Link className="button button--secondary button--lg" to={getPlatformDownloadUrl(userPlatform.os, userPlatform.arch)} style={{ marginRight: '10px' }}>
                  {getPlatformIcon(userPlatform.os)}
                  Download for {getPlatformLabel(userPlatform.os, userPlatform.arch)}
                </Link>
              )}
              <Link className="button button--outline button--lg" to="#downloads" style={{ marginRight: '10px' }}>
                📥 All Downloads
              </Link>
            </>
          )}
        </div>

        {release && <p className={styles.versionInfo}>Latest version: {release.tag_name}</p>}

        <div className={styles.buttons} style={{ marginTop: '20px' }}>
          <Link className="button button--outline button--md" to="/app" style={{ marginRight: '10px' }}>
            🖥️ Goto Web App
          </Link>
          <Link className="button button--outline button--md" to="/docs/manual" style={{ marginRight: '10px' }}>
            📖 Manual
          </Link>
          <Link className="button button--outline button--md" to="https://github.com/gbmhunter/NinjaTerm">
            ⭐ GitHub
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();

  const [release, setRelease] = useState<GitHubRelease | null>(null);
  const [loading, setLoading] = useState(false);
  const [userPlatform, setUserPlatform] = useState<{ os: string; arch: string } | null>(null);

  useEffect(() => {
    // Detect user's platform and architecture
    const detectPlatform = () => {
      const userAgent = navigator.userAgent;
      let os = '';
      let arch = '';

      // Detect OS
      if (userAgent.includes('Win')) {
        os = 'win';
      } else if (userAgent.includes('Mac')) {
        os = 'mac';
      } else if (userAgent.includes('Linux')) {
        os = 'linux';
      }

      // Detect architecture
      if (userAgent.includes('x86_64') || userAgent.includes('Win64') || userAgent.includes('WOW64')) {
        arch = 'x64';
      } else if (userAgent.includes('arm64') || userAgent.includes('aarch64')) {
        arch = 'arm64';
      } else if (userAgent.includes('Intel Mac')) {
        arch = 'x64';
      } else if (os === 'mac' && !userAgent.includes('Intel')) {
        // Modern Macs without Intel in user agent are likely Apple Silicon
        arch = 'arm64';
      } else if (os === 'win' || os === 'linux') {
        // Default to x64 for Windows/Linux if unclear
        arch = 'x64';
      }

      // Only set platform if we have both OS and arch
      if (os && arch) {
        setUserPlatform({ os, arch });
      }
    };

    // Fetch latest release data
    const fetchLatestRelease = async () => {
      setLoading(true);
      try {
        const response = await fetch('https://api.github.com/repos/gbmhunter/NinjaTerm/releases/latest');
        if (response.ok) {
          const releaseData = await response.json();
          setRelease(releaseData);
        }
      } catch (error) {
        console.error('Failed to fetch release data:', error);
      } finally {
        setLoading(false);
      }
    };

    detectPlatform();
    fetchLatestRelease();
  }, []);

  // Helper functions to get download URLs
  const getPlatformDownloadUrl = (os: string, arch: string) => {
    if (!release) return null;

    if (os === 'win' && arch === 'x64') {
      const windowsAsset = release.assets.find((asset) => asset.name.includes('Setup') && asset.name.includes('x64') && asset.name.endsWith('.exe'));
      return windowsAsset?.browser_download_url || null;
    }

    if (os === 'mac') {
      const macAsset = release.assets.find((asset) => asset.name.endsWith('.dmg') && (arch === 'arm64' ? asset.name.includes('arm64') : asset.name.includes('x64')));
      return macAsset?.browser_download_url || null;
    }

    if (os === 'linux') {
      const linuxAsset = release.assets.find(
        (asset) => asset.name.endsWith('.AppImage') && (arch === 'arm64' ? asset.name.includes('arm64') : asset.name.includes('x64') || asset.name.includes('x86_64'))
      );
      return linuxAsset?.browser_download_url || null;
    }

    return null;
  };

  const getPlatformLabel = (os: string, arch: string) => {
    const osLabels: { [key: string]: string } = {
      win: 'Windows',
      mac: 'macOS',
      linux: 'Linux',
    };
    const archLabels: { [key: string]: string } = {
      x64: 'x64',
      arm64: 'ARM64',
    };
    return `${osLabels[os]} (${archLabels[arch]})`;
  };

  const getPlatformIcon = (os: string) => {
    if (os === 'win') {
      return <img src={WindowsLogoPng} alt="Windows" style={{ width: '20px', height: '20px' }} />;
    }
    if (os === 'linux') {
      return <img src={LinuxLogoPng} alt="Linux" style={{ width: '20px', height: '20px' }} />;
    }
    if (os === 'mac') {
      return <img src={MacLogoPng} alt="macOS" style={{ width: '20px', height: '20px' }} />;
    }
    return <DownloadIcon />;
  };

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'NinjaTerm',
    alternateName: 'Ninja Term',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Cross-platform (Web-based)',
    description:
      'NinjaTerm is a free, open-source, web-based serial port terminal for embedded developers. View debug data, send commands, and streamline your embedded development workflow with features like ANSI escape code support, graphing, logging, filtering and more.',
    keywords:
      'NinjaTerm, Ninja Term, terminal, serial port, serial terminal, web serial, developer tool, embedded, IoT, microcontroller, firmware, debug, open source, serial monitor, graphing, logging, filtering, smart scrolling, number types',
    url: 'https://ninjaterm.mbedded.ninja/',
    potentialAction: {
      '@type': 'ViewAction',
      target: 'https://ninjaterm.mbedded.ninja/app',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <Layout
      title="NinjaTerm - A serial port terminal that's got your back"
      description="NinjaTerm is a free, open-source serial port terminal for embedded developers with features like ANSI escape codes, graphing, logging, and more."
    >
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </Head>
      {/* <HomepageHeader /> */}
      <Grid size={12} sx={{ height: '20px' }} />

      <Grid size={12} sx={{ display: 'flex', justifyContent: 'center' }}>
        <img src={GitHubReadmeLogoPng} alt="NinjaTerm logo." style={{ maxWidth: '100%', width: '600px', height: 'auto' }} />
      </Grid>
      <Grid size={12} sx={{ height: '20px' }} />
      <Grid size={12} sx={{ display: 'flex', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'monospace', fontSize: 'clamp(18px, 5vw, 30px)', textAlign: 'center' }}>
          A serial port terminal that's got your back.
          <span className={styles.cursor}>&nbsp;</span>
        </span>
      </Grid>
      <Grid size={12} sx={{ height: '20px' }} />

      {/* Primary Download Buttons */}
      <Grid
        size={12}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: { xs: '10px', sm: '20px' },
          flexWrap: 'wrap',
          marginBottom: '20px',
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CircularProgress size={20} />
            <Typography>Loading latest release...</Typography>
          </Box>
        ) : (
          <>
            {userPlatform && getPlatformDownloadUrl(userPlatform.os, userPlatform.arch) && (
              <Button
                href={getPlatformDownloadUrl(userPlatform.os, userPlatform.arch) || undefined}
                variant="contained"
                size="large"
                startIcon={getPlatformIcon(userPlatform.os)}
                sx={{
                  minWidth: { xs: '200px', sm: '250px' },
                  backgroundColor: '#D16A2A',
                  '&:hover': { backgroundColor: '#D16A2A' },
                }}
              >
                Download for {getPlatformLabel(userPlatform.os, userPlatform.arch)}
              </Button>
            )}
            <Button
              href="#downloads"
              variant="outlined"
              size="large"
              startIcon={<DownloadIcon />}
              sx={{
                minWidth: { xs: '120px', sm: '150px' },
              }}
            >
              All Downloads
            </Button>
          </>
        )}
      </Grid>

      {/* Version Info */}
      {release && (
        <Grid size={12} sx={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
          <Typography variant="body2" sx={{ color: '#888', fontSize: '14px' }}>
            Latest version: {release.tag_name}
          </Typography>
        </Grid>
      )}

      {/* Secondary Options */}
      <Grid
        size={12}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: { xs: '10px', sm: '15px' },
          flexWrap: 'wrap',
        }}
      >
        <Button href="/app" variant="outlined" size="medium" startIcon={<TerminalIcon />}>
          Goto Web App
        </Button>
        <Button href="/docs/manual" variant="outlined" size="medium" startIcon={<InfoIcon />}>
          Manual
        </Button>
        <Button href="https://github.com/gbmhunter/NinjaTerm" target="_blank" variant="outlined" size="medium" startIcon={<GitHubIcon />}>
          GitHub
        </Button>
      </Grid>

      <main>
        <div className="container">
          <div className={styles.section}>
            <p className={styles.description}>
              NinjaTerm is an open source and free electron (or web-based) application designed for viewing debug serial port data and sending commands when developing firmware for
              an embedded device (e.g. microcontroller). TEST
            </p>
            <p className={styles.description}>
              If you are looking for a serious terminal for continual use, the installable desktop versions are recommended. If you are looking for a quick way to view some serial
              data without having to install anything, the web-based version is for you!
            </p>
            <p className={styles.description}>
              For the web-based version, natively supported browsers include Chromium-based desktop browsers (e.t.c. Chrome, Edge, Brave) and Opera. Firefox is supported but you
              have to install the{' '}
              <a href="https://addons.mozilla.org/en-US/firefox/addon/webserial-for-firefox/" target="_blank">
                WebSerial for Firefox extension
              </a>{' '}
              first. Unfortunately Safari is not supported (as of June 2024).
            </p>
            <p className={styles.description}>
              See{' '}
              <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility" target="_blank">
                https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility
              </a>{' '}
              for a compatibility table.
            </p>
          </div>

          {/* Downloads Section */}
          <Grid container size={12} spacing={2} sx={{ marginBottom: '40px' }}>
            <Grid size={12}>
              <Typography style={{ marginBottom: '20px', fontSize: 'clamp(14px, 4vw, 18px)' }}>
                Download NinjaTerm for your operating system. If you're not sure which version to download, use the platform-specific button above or check the explanations below:
              </Typography>
            </Grid>

            {/* Windows Downloads */}
            <Grid size={{ xs: 12, md: 6 }}>
              <div
                style={{
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  padding: '20px',
                  height: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                  <img
                    src={WindowsLogoPng}
                    alt="Windows"
                    style={{
                      width: '24px',
                      height: '24px',
                      marginRight: '10px',
                      filter: 'brightness(0) saturate(100%) invert(64%) sepia(20%) saturate(1653%) hue-rotate(347deg) brightness(99%) contrast(89%)',
                    }}
                  />
                  <Typography variant="h6" style={{ color: '#E47F37' }}>
                    Windows
                  </Typography>
                </div>

                {release &&
                  release.assets
                    .filter((asset) => asset.name.includes('Setup') && asset.name.endsWith('.exe'))
                    .map((asset) => (
                      <div key={asset.name} style={{ marginBottom: '10px' }}>
                        <Button
                          href={asset.browser_download_url}
                          variant="outlined"
                          size="small"
                          startIcon={<DownloadIcon />}
                          sx={{ marginBottom: '8px', minWidth: { xs: '150px', sm: '200px' }, fontSize: { xs: '12px', sm: '14px' } }}
                        >
                          {asset.name}
                        </Button>
                        <Typography variant="body2" style={{ color: '#ccc', fontSize: '14px' }}>
                          {asset.name.includes('x64') ? 'For modern Windows computers (64-bit). This works on most Windows PCs made after 2010.' : 'Standard Windows installer'}
                        </Typography>
                      </div>
                    ))}
                {(!release || release.assets.filter((asset) => asset.name.includes('Setup') && asset.name.endsWith('.exe')).length === 0) && (
                  <Typography variant="body2" style={{ color: '#888' }}>
                    Loading Windows downloads...
                  </Typography>
                )}
              </div>
            </Grid>

            {/* macOS Downloads */}
            <Grid size={{ xs: 12, md: 6 }}>
              <div
                style={{
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  padding: '20px',
                  height: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                  <img
                    src={MacLogoPng}
                    alt="macOS"
                    style={{
                      width: '24px',
                      height: '24px',
                      marginRight: '10px',
                      filter: 'brightness(0) saturate(100%) invert(64%) sepia(20%) saturate(1653%) hue-rotate(347deg) brightness(99%) contrast(89%)',
                    }}
                  />
                  <Typography variant="h6" style={{ color: '#E47F37' }}>
                    macOS
                  </Typography>
                </div>

                {release &&
                  release.assets
                    .filter((asset) => asset.name.endsWith('.dmg'))
                    .map((asset) => (
                      <div key={asset.name} style={{ marginBottom: '10px' }}>
                        <Button
                          href={asset.browser_download_url}
                          variant="outlined"
                          size="small"
                          startIcon={<DownloadIcon />}
                          sx={{ marginBottom: '8px', minWidth: { xs: '150px', sm: '200px' }, fontSize: { xs: '12px', sm: '14px' } }}
                        >
                          {asset.name}
                        </Button>
                        <Typography variant="body2" style={{ color: '#ccc', fontSize: '14px' }}>
                          {asset.name.includes('arm64')
                            ? 'For Apple Silicon Macs (M1, M2, M3 chips). Choose this if you have a Mac made after late 2020.'
                            : asset.name.includes('x64')
                            ? 'For Intel Macs (older Macs with Intel processors). Choose this if you have a Mac made before 2021.'
                            : 'macOS installer'}
                        </Typography>
                      </div>
                    ))}
                {(!release || release.assets.filter((asset) => asset.name.endsWith('.dmg')).length === 0) && (
                  <Typography variant="body2" style={{ color: '#888' }}>
                    Loading macOS downloads...
                  </Typography>
                )}
              </div>
            </Grid>

            {/* Linux Downloads */}
            <Grid size={12}>
              <div
                style={{
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  padding: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                  <img
                    src={LinuxLogoPng}
                    alt="Linux"
                    style={{
                      width: '24px',
                      height: '24px',
                      marginRight: '10px',
                      filter: 'brightness(0) saturate(100%) invert(64%) sepia(20%) saturate(1653%) hue-rotate(347deg) brightness(99%) contrast(89%)',
                    }}
                  />
                  <Typography variant="h6" style={{ color: '#E47F37' }}>
                    Linux
                  </Typography>
                </div>

                <Grid container spacing={2}>
                  {/* AppImage Downloads */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle1" style={{ color: '#fff', marginBottom: '10px' }}>
                      AppImage (Recommended)
                    </Typography>
                    <Typography variant="body2" style={{ color: '#ccc', marginBottom: '15px', fontSize: '14px' }}>
                      Portable applications that work on most Linux distributions. No installation required - just download, make executable, and run. <code>.AppImage</code> does
                      require FUSE to be installed (<code>sudo apt install fuse</code> on Debian-based distros).
                    </Typography>
                    {release &&
                      release.assets
                        .filter((asset) => asset.name.endsWith('.AppImage'))
                        .map((asset) => (
                          <div key={asset.name} style={{ marginBottom: '10px' }}>
                            <Button
                              href={asset.browser_download_url}
                              variant="outlined"
                              size="small"
                              startIcon={<DownloadIcon />}
                              sx={{ marginBottom: '8px', minWidth: { xs: '180px', sm: '250px' }, fontSize: { xs: '11px', sm: '14px' } }}
                            >
                              {asset.name}
                            </Button>
                            <Typography variant="body2" style={{ color: '#ccc', fontSize: '14px' }}>
                              {asset.name.includes('arm64')
                                ? 'For ARM64 computers (Raspberry Pi 4+, some newer laptops with ARM processors)'
                                : 'For standard Linux computers (x86_64). This works on most Linux PCs and laptops.'}
                            </Typography>
                          </div>
                        ))}
                  </Grid>

                  {/* DEB Downloads */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle1" style={{ color: '#fff', marginBottom: '10px' }}>
                      DEB Packages
                    </Typography>
                    <Typography variant="body2" style={{ color: '#ccc', marginBottom: '15px', fontSize: '14px' }}>
                      For Debian-based distributions (Ubuntu, Linux Mint, Elementary OS, etc.). Install with: <code>sudo dpkg -i filename.deb</code>.
                    </Typography>
                    {release &&
                      release.assets
                        .filter((asset) => asset.name.endsWith('.deb'))
                        .map((asset) => (
                          <div key={asset.name} style={{ marginBottom: '10px' }}>
                            <Button
                              href={asset.browser_download_url}
                              variant="outlined"
                              size="small"
                              startIcon={<DownloadIcon />}
                              sx={{ marginBottom: '8px', minWidth: { xs: '180px', sm: '250px' }, fontSize: { xs: '11px', sm: '14px' } }}
                            >
                              {asset.name}
                            </Button>
                            <Typography variant="body2" style={{ color: '#ccc', fontSize: '14px' }}>
                              {asset.name.includes('arm64')
                                ? 'For ARM64 computers (Raspberry Pi 4+, some newer laptops with ARM processors)'
                                : 'For standard Linux computers (x86_64). This works on most Linux PCs and laptops.'}
                            </Typography>
                          </div>
                        ))}
                  </Grid>
                </Grid>

                {(!release || release.assets.filter((asset) => asset.name.endsWith('.AppImage') || asset.name.endsWith('.deb')).length === 0) && (
                  <Typography variant="body2" style={{ color: '#888' }}>
                    Loading Linux downloads...
                  </Typography>
                )}
              </div>
            </Grid>

            {/* Architecture Help */}
            <Grid size={12}>
              <div
                style={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  padding: '15px',
                }}
              >
                <Typography variant="h6" style={{ color: '#E47F37', marginBottom: '10px' }}>
                  Not sure which architecture to choose?
                </Typography>
                <Typography variant="body2" style={{ color: '#ccc', marginBottom: '8px' }}>
                  <strong>x64/x86_64:</strong> Standard 64-bit processors. This is what most computers use (Intel Core i3/i5/i7, AMD Ryzen, older Macs).
                </Typography>
                <Typography variant="body2" style={{ color: '#ccc', marginBottom: '8px' }}>
                  <strong>ARM64:</strong> Newer ARM-based processors. This includes Apple Silicon Macs (M1/M2/M3), Raspberry Pi 4+, and some newer Windows laptops.
                </Typography>
                <Typography variant="body2" style={{ color: '#ccc' }}>
                  <strong>When in doubt:</strong> Try x64 first - it works on most computers. If it doesn't work, then try ARM64.
                </Typography>
              </div>
            </Grid>
          </Grid>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Features</h2>

            <div className={styles.feature}>
              <h3>ANSI Escape Code Support</h3>
              <p>Rich support for ANSI CSI colour codes, giving you ability to express information however you see fit! (e.g. colour errors red, warnings yellow).</p>
              <div className={styles.videoContainer}>
                <video autoPlay loop muted playsInline className={styles.featureVideo} poster={AnsiEscapeCodeColoursWebM}>
                  <source src={AnsiEscapeCodeColoursWebM} type="video/webm" />
                  Demonstration of ANSI escape codes in NinjaTerm.
                </video>
              </div>
            </div>

            <div className={styles.feature}>
              <h3>Graphing</h3>
              <p>
                Extract data from your stream of debug data and graph it! Flexible options to extract data from text based serial streams, or dedicate the serial port for data
                only!
              </p>
              <div className={styles.videoContainer}>
                <video autoPlay loop muted playsInline className={styles.featureVideo} poster={GraphingWebM}>
                  <source src={GraphingWebM} type="video/webm" />
                  Demonstration of graphing in NinjaTerm.
                </video>
              </div>
            </div>

            <div className={styles.feature}>
              <h3>Smart Scrolling</h3>
              <p>
                Most of the time you want to see the most recent information printed to the screen. NinjaTerm has a "scroll lock" feature to allow for that. However, scrolling up
                allows you to break the "scroll lock" and focus on previous info (e.g. an error that occurred). NinjaTerm will adjust the scroll point to keep that information in
                view even if the scrollback buffer is full.
              </p>
              <div className={styles.videoContainer}>
                <video autoPlay loop muted playsInline className={styles.featureVideo} poster={SmartScrollWebM}>
                  <source src={SmartScrollWebM} type="video/webm" />
                  Demonstration of smart scrolling in NinjaTerm.
                </video>
              </div>
            </div>

            <div className={styles.feature}>
              <h3>Show Invisible Characters</h3>
              <p>
                When debugging ASCII based data, sometimes unexpected "invisible" characters such as ASCII control characters or bytes above 0x7F (which are not part of ASCII)
                cause weird things to happen to your data! NinjaTerm contains a special font with glyphs for all ASCII control chars and all hex codes from 0x00 to 0xFF. Enable
                this mode from the settings to "see" any received byte of data!
              </p>
              <div className={styles.videoContainer}>
                <video autoPlay loop muted playsInline className={styles.featureVideo} poster={ControlCharAndHexCodeGlyphsWebM}>
                  <source src={ControlCharAndHexCodeGlyphsWebM} type="video/webm" />
                  Demonstration of ASCII control character and hex code glyphs in NinjaTerm.
                </video>
              </div>
            </div>

            <div className={styles.feature}>
              <h3>Logging</h3>
              <p>
                Log your data to the file system for future retrieval or post analysis with other software. The file is written to once per second so your previous data should
                still be there even if the computer crashes/resets!
              </p>
              <div className={styles.videoContainer}>
                <video autoPlay loop muted playsInline className={styles.featureVideo} poster={LoggingWebM}>
                  <source src={LoggingWebM} type="video/webm" />
                  Demonstration of logging functionality in NinjaTerm.
                </video>
              </div>
            </div>

            <div className={styles.feature}>
              <h3>Filtering</h3>
              <p>
                Narrow down on the info you want by using filtering! Great for quickly finding errors, warnings, or debug prints from specific modules. Only rows of received data
                matching the filter text are shown. Clear the filter text to show all rows again.
              </p>
              <div className={styles.videoContainer}>
                <video autoPlay loop muted playsInline className={styles.featureVideo} poster={FilteringWebM}>
                  <source src={FilteringWebM} type="video/webm" />
                  Demonstration of filtering functionality in NinjaTerm.
                </video>
              </div>
            </div>

            <div className={styles.feature}>
              <h3>Number Types</h3>
              <p>
                Don't just treat your data as ASCII! NinjaTerm also supports parsing received data as various numbers, including hex (variable byte length), uint8, int8, uint16,
                float32, e.t.c. View your data in the way you want it.
              </p>
              <div className={styles.videoContainer}>
                <video autoPlay loop muted playsInline className={styles.featureVideo} poster={NumberTypesWebM}>
                  <source src={NumberTypesWebM} type="video/webm" />
                  Demonstration of number parsing in NinjaTerm.
                </video>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>And more!</h2>
            <ul>
              <li>Ability to switch between a combined TX/RX terminal and separate terminals.</li>
              <li>Options for controlling carriage return (CR) and line feed (LF) behavior.</li>
              <li>
                Smart copy/paste between the terminals and the clipboard with Ctrl-Shift-C and Ctrl-Shift-V. When copying to the clipboard, rows in the terminal created due to
                wrapping do not insert new lines into the clipboard data.
              </li>
              <li>Macros to send repetitive ASCII or HEX data easily.</li>
              <li>Send 200ms "break signals" with Ctrl-Shift-B.</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Bugs and Features</h2>
            <p>
              Found a bug? Have a awesome feature you'd like added to NinjaTerm? <a href="https://github.com/gbmhunter/NinjaTerm/issues">Open an issue on GitHub</a>.
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Contributors</h2>
            <p>Thanks to Zac Frank for user-interaction guidance and tips!</p>
            <p>Thanks to testing done by William Hunter.</p>
            <p>
              Thanks to <a href="https://github.com/johnhofman">John Hofman</a> for helping port the project to Maven and setup TravisCI (back when NinjaTerm was written in Java).
            </p>
            <p>Big ups to "utopian" to creating the new NinjaTerm logo!</p>

            <hr />

            <p style={{ fontWeight: 'bold', marginBottom: '50px' }}>
              NinjaTerm is developed and maintained by Geoffrey Hunter{' '}
              <a href="https://twitter.com/gbmhunter" target="_blank">
                🐦
              </a>{' '}
              (<a href="https://blog.mbedded.ninja/">blog.mbedded.ninja</a>).
            </p>
          </div>
        </div>
      </main>
    </Layout>
  );
}
