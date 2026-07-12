import React from 'react';
import {
  Typography,
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Theme,
} from '@mui/material';
import { WithStyles } from '@mui/styles';
import withStyles from '@mui/styles/withStyles';
import createStyles from '@mui/styles/createStyles';

import NavBar from 'common/NavBar';
import Footer from 'common/Footer';

interface FeatureItem {
  number: number;
  title: string;
  subtitle?: string;
  points: string[];
  purpose: string;
}

const features: FeatureItem[] = [
  {
    number: 1,
    title: "Interactive Global Map",
    points: [
      "Displays monitoring locations across the world.",
      "Users can zoom, pan, and select locations.",
      "Shows sensor stations, coral reefs, and monitoring sites.",
      "Clicking a location opens detailed environmental information."
    ],
    purpose: "Makes it easy to find and explore ocean monitoring sites."
  },
  {
    number: 2,
    title: "Real-Time Environmental Monitoring",
    subtitle: "Aqualink collects environmental information from sensors and satellites. It monitors:",
    points: [
      "Sea Surface Temperature (SST)",
      "Water Temperature",
      "Salinity",
      "pH",
      "Dissolved Oxygen",
      "Turbidity",
      "Wind Speed",
      "Wave Height"
    ],
    purpose: "Helps users understand current ocean conditions."
  },
  {
    number: 3,
    title: "Sensor Data Integration",
    subtitle: "The platform supports data from different marine sensors. Examples:",
    points: [
      "Temperature sensors",
      "Salinity sensors",
      "Water quality sensors",
      "Weather stations",
      "Ocean buoys",
      "All sensor data is stored and displayed in one dashboard."
    ],
    purpose: "Centralizes data from multiple monitoring devices."
  },
  {
    number: 4,
    title: "Time-Series Graphs",
    subtitle: "Users can view historical trends of environmental parameters. Examples:",
    points: [
      "Temperature over the last week",
      "Salinity over a month",
      "pH changes over time",
      "Charts help identify increasing trends, seasonal changes, and sudden environmental events."
    ],
    purpose: "Provides temporal analysis and change detection."
  },
  {
    number: 5,
    title: "Coral Reef Monitoring",
    subtitle: "Aqualink is designed to support coral reef conservation. It helps monitor:",
    points: [
      "Coral bleaching",
      "Reef health",
      "Heat stress",
      "Marine biodiversity",
      "Environmental changes affecting reefs"
    ],
    purpose: "Supports targeted reef preservation efforts."
  },
  {
    number: 6,
    title: "Satellite Data Integration",
    subtitle: "The platform combines satellite observations with sensor measurements. Satellite information includes:",
    points: [
      "Sea Surface Temperature",
      "Chlorophyll concentration",
      "Heat stress indicators",
      "Ocean color",
      "Weather conditions"
    ],
    purpose: "Provides broader ocean coverage than local sensors alone."
  },
  {
    number: 7,
    title: "Data Visualization Dashboard",
    subtitle: "Users can easily compare different ocean parameters through a unified interface. The dashboard includes:",
    points: [
      "Interactive maps",
      "Line charts",
      "Trend graphs",
      "Environmental indicators",
      "Data tables"
    ],
    purpose: "Provides a holistic visual summary of environmental parameters."
  },
  {
    number: 8,
    title: "Survey and Observation Management",
    subtitle: "Researchers can create a historical record for future comparison:",
    points: [
      "Upload field observations",
      "Attach photographs",
      "Record notes",
      "Store survey results",
      "Document reef conditions"
    ],
    purpose: "Creates a rich historical archive of field surveys."
  },
  {
    number: 9,
    title: "Data Management",
    subtitle: "Empowers researchers to query and handle large datasets:",
    points: [
      "Store monitoring data",
      "Organize datasets",
      "Filter by location",
      "Search records",
      "Retrieve historical information"
    ],
    purpose: "Simplifies data archiving and querying."
  },
  {
    number: 10,
    title: "User-Friendly Interface",
    subtitle: "Designed to be suitable for researchers, students, conservationists, and environmental organizations:",
    points: [
      "Responsive web interface",
      "Easy navigation",
      "Interactive controls",
      "Clear visualizations",
      "Simple workflows"
    ],
    purpose: "Lowers the barrier to entry for ocean data exploration."
  },
  {
    number: 11,
    title: "Open-Source Platform",
    subtitle: "Aqualink is open source, allowing developers globally to:",
    points: [
      "Customize the platform",
      "Add new features",
      "Integrate additional sensors",
      "Build new applications",
      "Contribute improvements"
    ],
    purpose: "Encourages global collaboration and transparency."
  },
  {
    number: 12,
    title: "Multi-Source Data Integration",
    subtitle: "The platform combines data from various platforms to offer a comprehensive view of marine ecosystems:",
    points: [
      "Ocean sensors",
      "Weather stations",
      "Satellite observations",
      "Field surveys",
      "Historical databases"
    ],
    purpose: "Provides a comprehensive and context-rich representation."
  }
];

interface SummaryRow {
  feature: string;
  purpose: string;
}

const summaryData: SummaryRow[] = [
  { feature: "Interactive Map", purpose: "Explore monitoring sites" },
  { feature: "Real-Time Monitoring", purpose: "Display current ocean conditions" },
  { feature: "Sensor Integration", purpose: "Collect data from multiple devices" },
  { feature: "Time-Series Charts", purpose: "Analyze trends over time" },
  { feature: "Coral Reef Monitoring", purpose: "Assess reef health" },
  { feature: "Satellite Integration", purpose: "Add large-scale environmental data" },
  { feature: "Dashboard", purpose: "Visualize data with maps and charts" },
  { feature: "Survey Management", purpose: "Store observations and photos" },
  { feature: "Data Management", purpose: "Organize and retrieve datasets" },
  { feature: "User-Friendly Interface", purpose: "Easy navigation and analysis" },
  { feature: "Open Source", purpose: "Extend and customize the platform" },
  { feature: "Multi-Source Data Integration", purpose: "Combine data from sensors, satellites, and surveys" }
];

function About({ classes }: AboutProps) {
  return (
    <>
      <NavBar searchLocation={false} />
      <Container className={classes.root} maxWidth="lg">
        {/* Page Header */}
        <Box className={classes.header}>
          <Typography variant="h3" component="h1" gutterBottom style={{ fontWeight: 600 }}>
            Platform Features
          </Typography>
          <Typography variant="h6" color="textSecondary" style={{ fontWeight: 300 }}>
            Explore the features and core architecture of AquaticAI
          </Typography>
        </Box>

        {/* 12 Features Grid */}
        <Grid container spacing={4}>
          {features.map((feat) => (
            <Grid key={feat.number} item xs={12} sm={6} md={4}>
              <Card className={classes.card} elevation={0}>
                <CardContent style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography className={classes.cardNumber}>
                        {feat.number < 10 ? `0${feat.number}` : feat.number}
                      </Typography>
                    </Box>
                    <Typography variant="h5" component="h2" gutterBottom style={{ fontWeight: 600 }}>
                      {feat.title}
                    </Typography>
                    {feat.subtitle && (
                      <Typography variant="body2" color="textSecondary" style={{ marginBottom: '0.75rem' }}>
                        {feat.subtitle}
                      </Typography>
                    )}
                    <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                      {feat.points.map((pt, i) => (
                        <li key={i} style={{ marginBottom: '0.5rem' }}>
                          <Typography variant="body2">{pt}</Typography>
                        </li>
                      ))}
                    </ul>
                  </Box>

                  <Box className={classes.purposeBox}>
                    <Typography variant="caption" className={classes.purposeTitle}>
                      Purpose
                    </Typography>
                    <Typography variant="body2" className={classes.purposeText}>
                      {feat.purpose}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Summary of Features Table */}
        <Box mt={8}>
          <Typography variant="h4" gutterBottom style={{ fontWeight: 600, textAlign: 'center' }}>
            Summary of Features
          </Typography>
          <TableContainer component={Paper} className={classes.tableContainer} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell className={classes.tableHeader} style={{ fontWeight: 'bold' }}>Feature</TableCell>
                  <TableCell className={classes.tableHeader} style={{ fontWeight: 'bold' }}>Purpose</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summaryData.map((row, idx) => (
                  <TableRow key={idx} style={{ backgroundColor: idx % 2 === 0 ? 'rgba(0, 0, 0, 0.02)' : 'transparent' }}>
                    <TableCell style={{ fontWeight: 500 }}>{row.feature}</TableCell>
                    <TableCell>{row.purpose}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Container>
    </>
  );
}

const styles = (theme: Theme) =>
  createStyles({
    root: {
      marginTop: '2rem',
      marginBottom: '4rem',
    },
    header: {
      marginBottom: '3rem',
      textAlign: 'center',
    },
    card: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: '8px',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[3],
      },
    },
    cardNumber: {
      color: theme.palette.primary.main,
      fontWeight: 'bold',
      fontSize: '1.5rem',
    },
    purposeBox: {
      marginTop: '1.5rem',
      padding: '0.75rem',
      borderRadius: '6px',
      backgroundColor: theme.palette.primary.main + '20', // Light opacity overlay of primary color (20% opacity)
      borderLeft: `4px solid ${theme.palette.primary.main}`,
    },
    purposeTitle: {
      color: theme.palette.primary.main,
      fontWeight: 'bold',
      display: 'block',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    purposeText: {
      color: theme.palette.primary.dark,
      fontWeight: 600,
    },
    tableContainer: {
      marginTop: '2rem',
      borderRadius: '8px',
      border: `1px solid ${theme.palette.divider}`,
      overflow: 'hidden',
    },
    tableHeader: {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
    },
  });

interface AboutProps extends WithStyles<typeof styles> {}

export default withStyles(styles)(About);
