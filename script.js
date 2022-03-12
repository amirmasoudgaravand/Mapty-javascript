'use strict';


class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);
    clicks = 0;
    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;

    }
    _setDescription() {

        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]}${this.date.getDate()} `;
    }
    click() {
        this.clicks++;
    }
}

class Running extends Workout {
    type = "running";
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration)
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }
    calcPace() {
        // min/km
        this.pace = this.duration / this.distance;
    }
}

class Cycling extends Workout {
    type = "cycling";
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        // this.type = 'cycling';
        this.calcSpeed();
        this._setDescription();
    }
    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}
const run1 = new Running([39, -12], 5.2, 24, 178);
const cycling1 = new Running([39, -12], 27, 95, 523);
//console.log(run1, cycling1);
//////////////////////
// APPLICATION ARCHITECTURE

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
let map, mapEvent, workout, cadence;

class App {
    constructor() {
        // let mapZoomLevel = 13;
        this.workouts = [];
        // Get data from local storage
        this.getLocalStorage();
        // Get users position

        this._getPosition();
        // Attach event handlers

        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField()
            // mitavan bedon parantez ham nevesht
        )
        containerWorkouts.addEventListener('click', this.moveToPopup.bind(this))
    }
    _getPosition() {

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this._loadMap,
                function () {
                    alert('Could not get your postion')
                });
        }
    }
    _loadMap(position) {

        const { latitude } = position.coords;
        const { longitude } = position.coords;
        //  console.log(`https://www.google.com/maps/@${latitude},${longitude} `);

        const coords = [33.8960051, 48.7516096];

        map = L.map('map').setView(coords, 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        map.on('click', function (mapE) {
            mapEvent = mapE;
            form.classList.remove("hidden");
            inputDistance.focus();
        });

    }
    _showForm() {
        // error this ra midahd dar line 48 agar block functoin map.on ra be in method beyavarim
    }
    hideForm() {
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => (form.style.display = 'grid'), 1111);
    }
    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _newWorkout(e) {
        const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));
        const allPositive = (...inputs) => inputs.every(inp => inp > 0);

        e.preventDefault();
        //  console.log(this);
        // Clear input fields
        // get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = mapEvent.latlng;

        // If workout running, create running object
        if (type === 'running') {
            // check if data is valid
            cadence = +inputCadence.value;
            if (
                !Number.isFinite(distance) || !Number.isFinite(duration) ||
                !Number.isFinite(cadence))
                //   !validInputs(distance, duration, cadence) ||
                //   !allPositive(distance, duration, cadence)
                // )
                return alert('Input have to be positive number')
            workout = new Running([lat, lng], distance, duration, cadence);
        }
        // If workout cycling,create cycling object
        if (type === 'cycling') {
            const elevation = +inputElevation.value;
            if (
                !validInputs(distance, duration, elevation) ||
                !allPositive(distance, duration)
            )
                return alert('Input have to be positive number')
            workout = new Cycling([lat, lng], distance, duration, elevation);

        }

        // Add new object to workout array
        this.workouts.push(workout);
        console.log(workout);
        // Render workout on map as marker
        this.renderWorkoutMarker(workout);

        // Render workout on list
        this._renderWorkout(workout);

        // Hide form+clear input fields
        this.hideForm();

        // Set local storage to all workouts

        this.setLocalStorage();
    }
    renderWorkoutMarker(workout) {
        L.marker(workout.coords)
            .addTo(map)
            .bindPopup(L.popup({
                maxWidth: 250,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`
            })).setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}${workout.description} `)
            .openPopup();

    }
    _renderWorkout(workout) {
        let html = `
<li class="workout workout--${workout.type} " data-id="${workout.id}">
          <h2 class="workout__title">
         ${workout.description} 
          </h2>
          <div class="workout__details">
            <span class="workout__icon"> 
            ${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}
           
            </span>
            <span class="workout__value">${workout.distance} </span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">
            ${workout.duration}
            </span>
            <span class="workout__unit">min</span>
          </div>
`;
        if (workout.type === 'cycling') {
            html += `<div class="workout__details">
    <span class="workout__icon">⚡️</span>
    <span class="workout__value">
    ${workout.speed.toFixed(1)}
    </span>
    <span class="workout__unit">min/km</span>
  </div>
  <div class="workout__details">
    <span class="workout__icon">🦶🏼</span>
    <span class="workout__value">
    ${workout.elevationGain}
    </span>
    <span class="workout__unit">spm</span>
  </div>
</li>`;
            form.insertAdjacentHTML('afterend', html);
        }
        if (workout.type === 'running') {
            html += `<div class="workout__details">
    <span class="workout__icon">⚡️</span>
    <span class="workout__value">
    ${workout.pace.toFixed(1)}
    </span>
    <span class="workout__unit">min/km</span>
  </div>
  <div class="workout__details">
    <span class="workout__icon">🚴‍♀️</span>
    <span class="workout__value">
    ${workout.elevationGain}
    </span>
    <span class="workout__unit">spm</span>
  </div>
</li>`;
            form.insertAdjacentHTML('afterend', html);
        }
    }
    moveToPopup(e) {
        const workoutEl = e.target.closest('.workout');
        console.log(workoutEl);
        if (!workoutEl) return;
        //const workout=this.
        workout = this.workouts.find(
            work => work.id === workoutEl.dataset.id
        );
        console.log(workout);
        map.setView(workout.coords, 13, {
            animate: true,
            pan: {
                duration: 1
            }
        });
        workout.click();
    }
    setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.workouts))
    }
    getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));
        console.log(data);
    }
}
const app = new App();


