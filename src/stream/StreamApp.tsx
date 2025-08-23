import { useState, useEffect, useMemo } from 'react';
import { io } from "socket.io-client";
import { FileReaderResponse, Settings } from '../@types/main.d';
import { useTranslation } from 'react-i18next';
import { Grid, createTheme } from '@mui/material';
import { getHolyGrailSeedData } from '../../electron/lib/holyGrailSeedData';
import { ThemeProvider } from '@mui/system';
import { GlobalStyle } from '../styles/GlobalStyle';
import { computeStats } from '../utils/objects';

import { Header, Container } from './styles';
import 'react-circular-progressbar/dist/styles.css';
import { Statistics } from '../components/Stats';

export default function StreamApp() {
  const [settings, setSettings] = useState<Settings>({} as Settings);
  const [data, setData] = useState<FileReaderResponse>({ items: {}, ethItems: {}, stats: {}, availableRunes: {} });
  const totalStats = useMemo(
    () => computeStats(data.items, data.ethItems, getHolyGrailSeedData(settings, false), getHolyGrailSeedData(settings, true), settings),
    [data, settings]
  );
  const { t, i18n } = useTranslation();

  const isOverlay = new URLSearchParams(window.location.search).get('overlay') === 'true';

  useEffect(() => {
    const socket = io();
    socket.on("updatedSettings", function (settings: Settings) {
      i18n.changeLanguage(settings.lang);
      setSettings(settings);
    });
    socket.on("openFolder", function (data: FileReaderResponse) {
      setData(data);
    });
  }, []);


  if (data === null) {
    return null;
  }

  if (isOverlay) {
    const overlayScale = settings.overlayScale || 1.0;
    const baseWidth = 300;
    const baseHeight = 250;
    const scaledWidth = Math.round(baseWidth * overlayScale);
    const scaledHeight = Math.round(baseHeight * overlayScale);
    
    return <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body, html {
          background: transparent !important;
          overflow: hidden !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        #root {
          background: transparent !important;
          overflow: hidden !important;
        }
        /* Force white text in overlay - more specific selectors */
        .overlay *,
        .overlay .MuiTypography-root,
        .overlay .CircularProgressbar-text,
        .overlay text,
        .overlay svg text,
        .overlay span {
          color: white !important;
          fill: white !important;
        }
        /* Ensure drag area is visible but transparent */
        .overlay .drag-area {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: transparent;
          z-index: 1;
        }
        .overlay .content-area {
          position: relative;
          z-index: 2;
          pointer-events: none;
        }
      `}</style>
      <div
        className="overlay"
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
          background: 'transparent',
          userSelect: 'none',
          position: 'relative',
          overflow: 'visible',
          margin: 0,
          padding: 0
        }}
      >
        {/* Invisible drag area covering the entire overlay */}
        <div 
          className="drag-area"
          style={{
            cursor: 'grab',
            WebkitAppRegion: 'drag'
          }}
        />
        
        {/* Content area */}
        <div 
          className="content-area"
          style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            width: '100%',
            height: '100%',
            overflow: 'visible',
            position: 'relative'
          }}
        >
          <div style={{
            transform: `scale(${0.65 * overlayScale})`,
            transformOrigin: 'center center'
          }}>
            <ThemeProvider theme={createTheme({
              palette: { 
                mode: 'dark',
                text: {
                  primary: '#ffffff',
                  secondary: '#ffffff'
                }
              },
              components: {
                MuiTypography: {
                  styleOverrides: {
                    root: {
                      color: '#ffffff !important',
                      '& *': {
                        color: '#ffffff !important'
                      }
                    }
                  }
                }
              }
            })}>
              <div style={{ color: 'white' }}>
                <Statistics appSettings={settings} holyGrailStats={totalStats} onlyCircle />
              </div>
            </ThemeProvider>
          </div>
        </div>
      </div>
    </>;
  }

  return <>
    <GlobalStyle />
    <ThemeProvider theme={createTheme({palette: { mode: 'dark' }})}>
      <Container>
        <Grid item xs={12}>
          <Header>{t('The Holy Grail')}</Header>
        </Grid>
        <Grid item xs={8} style={{ position: 'relative' }}>
          <Statistics appSettings={settings} holyGrailStats={totalStats} onlyCircle />
        </Grid>
      </Container>
    </ThemeProvider>
  </>;
}