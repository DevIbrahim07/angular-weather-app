import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { WeatherData, WeatherService } from './service/weather-service';

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly weatherService = inject(WeatherService);

  readonly searchForm = this.fb.nonNullable.group({
    latitude: ['40.730610', Validators.required],
    longitude: ['-73.935242', Validators.required],
  });

  readonly weatherData = signal<WeatherData | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    this.searchWeather();
  }

  searchWeather(): void {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    const latitudeValue = Number(this.searchForm.controls.latitude.value.trim());
    const longitudeValue = Number(this.searchForm.controls.longitude.value.trim());

    if (Number.isNaN(latitudeValue) || Number.isNaN(longitudeValue)) {
      this.errorMessage.set('Latitude and longitude must be valid numbers.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.weatherService.searchWeatherByCoordinates(latitudeValue, longitudeValue).subscribe({
      next: (res) => {
        this.weatherData.set(res);
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        this.weatherData.set(null);
        this.errorMessage.set(err.message);
        this.isLoading.set(false);
      },
    });
  }
}
