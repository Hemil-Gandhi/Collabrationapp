import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormArray,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { Niche, UserRole, Country, Industry } from '../../models/enums';

@Component({
  selector: 'app-profile-creation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, IonicModule],
  templateUrl: './profile-creation.component.html',
  styleUrls: ['./profile-creation.component.scss'],
})
export class ProfileCreationComponent implements OnInit {
  profileForm!: FormGroup;
  role: UserRole | null = null;
  isLoading = false;
  errorMsg = '';
  avatarBase64 = '';

  nicheOptions = Object.values(Niche);

  countryOptions = Object.values(Country);
  selectedNiches: Niche[] = [];
  selectedCountries: Country[] = [];
  industryOptions: Industry[] = Object.values(Industry);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.initializeProfileCreation();
  }

  ionViewWillEnter() {
    this.initializeProfileCreation();
  }

  private initializeProfileCreation() {
    this.role = this.authService.getRole() as UserRole | null;
    if (!this.role || !this.authService.currentUserValue) {
      this.router.navigate(['/login']);
      return;
    }
    this.avatarBase64 = '';
    this.selectedNiches = [];
    this.initForm();
  }

  initForm() {
    const userEmail = this.authService.currentUserValue?.email || '';
    if (this.role === UserRole.INFLUENCER) {
      this.profileForm = this.fb.group(
        {
          name: ['', [Validators.required, Validators.maxLength(100)]],
          username: [
            '',
            [
              Validators.required,
              Validators.minLength(3),
              Validators.pattern('^[a-zA-Z0-9_.]+$'),
            ],
          ],
          email: [
            { value: userEmail, disabled: true },
            [Validators.required, Validators.email],
          ],
          phone: [
            '',
            [
              Validators.required,
              Validators.pattern('^[0-9\\+\\-\\s]{10,15}$'),
            ],
          ],
          bio: ['', [Validators.required, Validators.maxLength(500)]],
          instagramUsername: [''],
          instagramFollowers: [null],
          youtubeUsername: [''],
          youtubeFollowers: [null],
          twitterUsername: [''],
          twitterFollowers: [null],
          pastWorkLinks: this.fb.array([]),
        },
        { validators: this.socialPlatformsValidator },
      );
    } else {
      this.profileForm = this.fb.group({
        email: [
          { value: userEmail, disabled: true },
          [Validators.required, Validators.email],
        ],
        phone: [
          '',
          [Validators.required, Validators.pattern('^[0-9\\+\\-\\s]{10,15}$')],
        ],
        firstName: ['', [Validators.required, Validators.maxLength(50)]],
        lastName: ['', [Validators.required, Validators.maxLength(50)]],
        companyName: ['', [Validators.required, Validators.maxLength(100)]],
        brandDescription: [
          '',
          [Validators.required, Validators.maxLength(500)],
        ],
        website: ['', [Validators.required, Validators.pattern('https?://.+')]],
        industry: ['', [Validators.required]],
        minBudget: [null, [Validators.required, Validators.min(0)]],
        maxBudget: [null, [Validators.required, Validators.min(0)]],
      });
    }
  }

  toggleCountry(country: string) {
    const countryEnum = country as Country;

    const index = this.selectedCountries.indexOf(countryEnum);

    if (index > -1) {
      this.selectedCountries.splice(index, 1);
    } else {
      this.selectedCountries.push(countryEnum);
    }
  }
  isCountrySelected(country: string): boolean {
    return this.selectedCountries.includes(country as Country);
  }

  socialPlatformsValidator(control: AbstractControl): ValidationErrors | null {
    const instagramUsername = control.get('instagramUsername')?.value;
    const instagramFollowers = control.get('instagramFollowers')?.value;
    const youtubeUsername = control.get('youtubeUsername')?.value;
    const youtubeFollowers = control.get('youtubeFollowers')?.value;
    const twitterUsername = control.get('twitterUsername')?.value;
    const twitterFollowers = control.get('twitterFollowers')?.value;

    const errors: ValidationErrors = {};

    const hasInstaUser = !!instagramUsername?.trim();
    const hasInstaFollowers =
      instagramFollowers !== null &&
      instagramFollowers !== undefined &&
      instagramFollowers !== '';
    if (hasInstaUser !== hasInstaFollowers) {
      errors['instagramIncomplete'] = true;
    }

    const hasYoutubeUser = !!youtubeUsername?.trim();
    const hasYoutubeFollowers =
      youtubeFollowers !== null &&
      youtubeFollowers !== undefined &&
      youtubeFollowers !== '';
    if (hasYoutubeUser !== hasYoutubeFollowers) {
      errors['youtubeIncomplete'] = true;
    }

    const hasTwitterUser = !!twitterUsername?.trim();
    const hasTwitterFollowers =
      twitterFollowers !== null &&
      twitterFollowers !== undefined &&
      twitterFollowers !== '';
    if (hasTwitterUser !== hasTwitterFollowers) {
      errors['twitterIncomplete'] = true;
    }

    const instaComplete = hasInstaUser && hasInstaFollowers;
    const youtubeComplete = hasYoutubeUser && hasYoutubeFollowers;
    const twitterComplete = hasTwitterUser && hasTwitterFollowers;

    if (!instaComplete && !youtubeComplete && !twitterComplete) {
      errors['noPlatformFilled'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  get pastWorkLinks() {
    return this.profileForm.get('pastWorkLinks') as FormArray;
  }

  addPastWorkLink(value: string = '') {
    this.pastWorkLinks.push(
      this.fb.control(value, [
        Validators.required,
        Validators.pattern('https?://.+'),
      ]),
    );
  }

  removePastWorkLink(index: number) {
    this.pastWorkLinks.removeAt(index);
  }

  toggleNiche(niche: string) {
    const nicheEnum = niche as Niche;
    const index = this.selectedNiches.indexOf(nicheEnum);
    if (index > -1) {
      this.selectedNiches.splice(index, 1);
    } else {
      this.selectedNiches.push(nicheEnum);
    }
  }

  isNicheSelected(niche: string): boolean {
    return this.selectedNiches.includes(niche as Niche);
  }

  onAvatarSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.avatarBase64 = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.errorMsg = 'Please fill out all required fields correctly.';
      return;
    }

    if (this.role === UserRole.INFLUENCER) {
      if (this.selectedNiches.length === 0) {
        this.errorMsg = 'Please select at least one niche.';
        return;
      }
      if (this.selectedCountries.length === 0) {
        this.errorMsg = 'Please select at least one country.';
        return;
      }
    }

    this.isLoading = true;
    this.errorMsg = '';

    const formValues = this.profileForm.getRawValue();
    let payload: any = {
      phone: formValues.phone,
      avatar: this.avatarBase64 || '',
    };

    if (this.role === UserRole.INFLUENCER) {
      payload = {
        ...payload,
        name: formValues.name,
        username: formValues.username,
        bio: formValues.bio,
        niches: this.selectedNiches,
        countries: this.selectedCountries,
        instagramUsername: formValues.instagramUsername || '',
        instagramFollowers: formValues.instagramFollowers || null,
        youtubeUsername: formValues.youtubeUsername || '',
        youtubeFollowers: formValues.youtubeFollowers || null,
        twitterUsername: formValues.twitterUsername || '',
        twitterFollowers: formValues.twitterFollowers || null,
        pastWorkLinks: formValues.pastWorkLinks || [],
        isVerified: false,
      };
    } else {
      payload = {
        ...payload,
        name: `${formValues.firstName} ${formValues.lastName}`,
        firstName: formValues.firstName,
        lastName: formValues.lastName,
        companyName: formValues.companyName,
        brandDescription: formValues.brandDescription,
        website: formValues.website,
        industry: formValues.industry,
        minBudget: formValues.minBudget,
        maxBudget: formValues.maxBudget,
        isVerified: false,
      };
    }

    this.authService.updateProfile(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = err.message || 'Failed to update profile.';
      },
    });
  }

  logout() {
    this.authService.logout();
  }
}
