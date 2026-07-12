import React, { useState, useEffect, useRef } from 'react';
import {
  useMediaQuery,
  useTheme,
  Container,
  Grid,
  Typography,
  Box,
  Button,
  Theme,
  Fab,
  ButtonProps,
} from '@mui/material';
import { WithStyles } from '@mui/styles';
import withStyles from '@mui/styles/withStyles';
import createStyles from '@mui/styles/createStyles';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { Link } from 'react-router-dom';

import classNames from 'classnames';
import NavBar from 'common/NavBar';
import Footer from 'common/Footer';
import { GaAction, GaCategory, trackButtonClick } from 'utils/google-analytics';
import Card from './Card';
import landingPageImage from '../../assets/img/landing-page/header.jpg';
import { cardTitles } from './titles';

interface LandingPageButton {
  label: string;
  to: string;
  variant: ButtonProps['variant'];
  hasWhiteColor?: boolean;
}

const landingPageButtons: LandingPageButton[] = [
  {
    label: 'View The Map',
    to: '/map',
    variant: 'contained',
  },
];

function LandingPage({ classes }: LandingPageProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const firstCard = useRef<HTMLDivElement>(null);

  const seeMore = () => {
    firstCard.current?.scrollIntoView({
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.pageYOffset);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <NavBar routeButtons={false} searchLocation={false} />
      <div>
        <Box display="flex" alignItems="top" className={classes.landingImage}>
          <Container className={classes.container}>
            <Grid container item xs={9}>
              <Box display="flex">
                <Typography variant="h1" color="textPrimary">
                  Aquatic
                </Typography>
                <Typography
                  className={classes.aqualinkSecondPart}
                  color="textPrimary"
                  variant="h1"
                >
                  AI
                </Typography>
              </Box>
            </Grid>
            <Grid container item sm={11} md={7}>
              <Box mt="1.5rem" display="flex">
                <Typography variant="h1" color="textPrimary">
                  Monitoring for marine ecosystems
                </Typography>
              </Box>
            </Grid>
            <Grid container item sm={11} md={8}>
              <Box mt="2.5rem" display="flex" flexDirection="column" style={{ gap: '1rem' }}>
                <Typography variant="h4" color="textPrimary" style={{ fontWeight: 400 }}>
                  Explore global ocean data instantly with our integrated map.
                </Typography>
                <Typography variant="h5" color="textPrimary" style={{ opacity: 0.9, fontWeight: 300, lineHeight: 1.6 }}>
                  Track active ARGO profiling floats, analyze real-time sea surface temperatures, salinity, chlorophyll, and dissolved oxygen concentrations, and query our intelligent FloatChat AI assistant for instant analytical summaries and forecast trends.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box mt="2rem">
                <Grid container spacing={2}>
                  {landingPageButtons.map(
                    ({ label, to, hasWhiteColor, variant }) => (
                      <Grid key={label} item xs={isTablet ? 12 : undefined}>
                        <Button
                          component={Link}
                          to={to}
                          className={classNames(classes.buttons, {
                            [classes.whiteColorButton]: hasWhiteColor,
                          })}
                          variant={variant}
                          color="primary"
                          onClick={() =>
                            trackButtonClick(
                              GaCategory.BUTTON_CLICK,
                              GaAction.LANDING_PAGE_BUTTON_CLICK,
                              label,
                            )
                          }
                        >
                          <Typography variant="h5">{label}</Typography>
                        </Button>
                      </Grid>
                    ),
                  )}
                </Grid>
              </Box>
            </Grid>
          </Container>
        </Box>
      </div>
    </>
  );
}

const styles = (theme: Theme) =>
  createStyles({
    landingImage: {
      backgroundImage: `url("${landingPageImage}")`,
      backgroundSize: 'cover',
      left: 160,
      height: 'calc(100vh - 64px)', // subtract height of the navbar
      overflow: 'hidden',
    },
    container: {
      [theme.breakpoints.up('sm')]: {
        paddingLeft: 60,
        paddingRight: 40,
      },
      paddingTop: 60,
    },
    aqualinkSecondPart: {
      opacity: 0.5,
    },
    cardContainer: {
      marginBottom: '1rem',
    },
    buttons: {
      height: 48,
      width: 208,
      textTransform: 'none',
      '&:hover': {
        color: 'white',
      },
      [theme.breakpoints.down('sm')]: {
        height: 40,
      },
    },
    whiteColorButton: {
      color: 'white',
      border: '2px solid white',
      '&:hover': {
        color: 'white',
        border: '2px solid white',
      },
    },
  });

type LandingPageProps = WithStyles<typeof styles>;

export default withStyles(styles)(LandingPage);
