import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

type ForecastEntry = {
  dt: number;
  dt_txt: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
};

type ForecastApiResponse = {
  cod: string;
  list: ForecastEntry[];
  city: {
    name: string;
    country: string;
    coord: {
      lat: number;
      lon: number;
    };
  };
};

export type WeatherData = {
  cityName: string;
  country: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  temp: number;
  feelsLike: number;
  humidity: number;
  wind: number;
  condition: string;
  description: string;
  forecast: Array<{
    timestamp: string;
    temp: number;
    humidity: number;
    wind: number;
    condition: string;
    icon: string;
  }>;
};

@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  private readonly apiKey = environment.rapidApi.key;
  private readonly apiHost = environment.rapidApi.host;
  private readonly apiUrl = 'https://open-weather13.p.rapidapi.com/fivedaysforcast';

  constructor(private http: HttpClient) {}

  searchWeatherByCoordinates(latitude: number, longitude: number): Observable<WeatherData> {
    if (!this.apiKey) {
      return throwError(
        () =>
          new Error(
            'Missing RapidAPI key. Add your key in src/environments/environment.development.ts.',
          ),
      );
    }

    const headers = new HttpHeaders()
      .set('X-RapidAPI-Key', this.apiKey)
      .set('X-RapidAPI-Host', this.apiHost)
      .set('Accept', 'application/json');

    const options = {
      headers,
      params: {
        latitude: String(latitude),
        longitude: String(longitude),
        lang: 'EN',
      },
    };

    return this.http.get<ForecastApiResponse>(this.apiUrl, options).pipe(
      map((response) => {
        const current = response.list[0];
        const forecast = response.list.slice(0, 8).map((item) => ({
          timestamp: item.dt_txt,
          temp: this.kelvinToCelsius(item.main.temp),
          humidity: item.main.humidity,
          wind: item.wind.speed,
          condition: item.weather[0]?.main ?? 'Unknown',
          icon: item.weather[0]?.icon ?? '01d',
        }));

        return {
          cityName: response.city.name,
          country: response.city.country,
          coordinates: {
            latitude: response.city.coord.lat,
            longitude: response.city.coord.lon,
          },
          temp: this.kelvinToCelsius(current.main.temp),
          feelsLike: this.kelvinToCelsius(current.main.feels_like),
          humidity: current.main.humidity,
          wind: current.wind.speed,
          condition: current.weather[0]?.main ?? 'Unknown',
          description: current.weather[0]?.description ?? 'No description',
          forecast,
        };
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 403) {
          return throwError(
            () =>
              new Error(
                '403 Forbidden from RapidAPI. Verify that your key is valid and your plan includes open-weather13.',
              ),
          );
        }

        return throwError(
          () =>
            new Error(
              'Unable to fetch forecast right now. Check coordinates and your network connection.',
            ),
        );
      }),
    );
  }

  private kelvinToCelsius(kelvin: number): number {
    return Math.round((kelvin - 273.15) * 10) / 10;
  }
}
