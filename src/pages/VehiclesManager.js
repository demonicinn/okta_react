import React, { Component, Fragment } from 'react';
import { withOktaAuth } from '@okta/okta-react';
import { withRouter, Route, Redirect, Link } from 'react-router-dom';
import {
  withStyles,
  Typography,
  Fab,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@material-ui/core';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from '@material-ui/icons';
import moment from 'moment';
import { find, orderBy } from 'lodash';
import { compose } from 'recompose';

import VehicleEditor from '../components/VehicleEditor';
import ErrorSnackbar from '../components/ErrorSnackbar';

const styles = theme => ({
  posts: {
    marginTop: theme.spacing(2),
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing(3),
    right: theme.spacing(3),
    [theme.breakpoints.down('xs')]: {
      bottom: theme.spacing(2),
      right: theme.spacing(2),
    },
  },
});

const API = 'http://localhost:3001';

class VehiclesManager extends Component {
  state = {
    loading: true,
    vehicles: [],
    error: null,
  };

  componentDidMount() {
    this.getVehicles();
  }

  async fetch(method, endpoint, body) {
    try {
      const response = await fetch(`${API}${endpoint}`, {
        method,
        body: body && JSON.stringify(body),
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          authorization: `Bearer ${await this.props.authService.getAccessToken()}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error(error);

      this.setState({ error });
    }
  }

  async getVehicles() {
    this.setState({ loading: false, vehicles: (await this.fetch('get', '/vehicles')) || [] });
  }

  saveVehicle = async (vehicle) => {
    if (vehicle.id) {
      await this.fetch('put', `/vehicles/${vehicle.id}`, vehicle);
    } else {
      await this.fetch('post', '/vehicles', vehicle);
    }

    this.props.history.goBack();
    this.getVehicles();
  }

  async deleteVehicle(vehicle) {
    if (window.confirm(`Are you sure you want to delete "${vehicle.year}"`)) {
      await this.fetch('delete', `/vehicles/${vehicle.id}`);
      this.getVehicles();
    }
  }

  renderVehicleEditor = ({ match: { params: { id } } }) => {
    if (this.state.loading) return null;
    const vehicle = find(this.state.vehicles, { id: Number(id) });

    if (!vehicle && id !== 'new') return <Redirect to="/vehicles" />;

    return <VehicleEditor vehicle={vehicle} onSave={this.saveVehicle} />;
  };

  render() {
    const { classes } = this.props;

    return (
      <Fragment>
        <Typography variant="h4">Vehicles Manager</Typography>
        {this.state.vehicles.length > 0 ? (
          <Paper elevation={1} className={classes.vehicles}>
            <List>
              {orderBy(this.state.vehicles, ['updatedAt', 'year'], ['desc', 'asc']).map(vehicle => (
                <ListItem key={vehicle.id} button component={Link} to={`/vehicles/${vehicle.id}`}>
                  <ListItemText
                    primary={vehicle.year}
                    secondary={vehicle.updatedAt && `Updated ${moment(vehicle.updatedAt).fromNow()}`}
                  />
                  <ListItemText primary={vehicle.make}/>
                  <ListItemText primary={vehicle.model}/>
                  <ListItemSecondaryAction>
                    <IconButton onClick={() => this.deleteVehicle(vehicle)} color="inherit">
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        ) : (
          !this.state.loading && <Typography variant="subtitle1">No vehicles to display</Typography>
        )}
        <Fab
          color="secondary"
          aria-label="add"
          className={classes.fab}
          component={Link}
          to="/vehicles/new"
        >
          <AddIcon />
        </Fab>

        <Route exact path="/vehicles/:id" render={this.renderVehicleEditor} />
        {this.state.error && (
          <ErrorSnackbar
            onClose={() => this.setState({ error: null })}
            message={this.state.error.message}
          />
        )}
      </Fragment>
    );
  }
}

export default compose(
  withOktaAuth,
  withRouter,
  withStyles(styles),
)(VehiclesManager);
