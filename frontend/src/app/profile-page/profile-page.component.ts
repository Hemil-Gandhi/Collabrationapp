import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  AbstractControl,
  ValidationErrors,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService, User } from '../services/auth.service';
import { Niche, Country, Industry } from '../models/enums';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, IonicModule],
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
})
export class ProfilePageComponent implements OnInit {
  profileForm!: FormGroup;
  user: User | null = null;
  isLoading = false;
  isConnectingInstagram = false;
  isSyncingInstagram = false;
  isUploadingMedia = false;
  avatarBase64 = '';
  avatarFile: File | null = null;
  instagramConnectToken =
    'EAAOOwy09uZA0BRrT7pv1LXxpNLk3FMBzjPFXXmlynEc7SqCdDrBaeTNMiyK0OrXOLzVZBfodvHMJgD3Hb1qSrCatnq4g37RWQ1hQvTCeGzvIKvszaqGrfySXDHrhjmlJzZAc0jP8gW8LSAeAnVP5NnPIDPrDqgRFF5KR6ffAMJ5ZAZAWZAxe7bKmxFyZAlM';

  nicheOptions = Object.values(Niche);
  countryOptions = Object.values(Country);

  selectedNiches: Niche[] = [];
  selectedCountries: Country[] = [];
  industryOptions = Object.values(Industry);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  hasChanges = false;

  ngOnInit() {
    this.userSub = this.authService.currentUser$.subscribe({
      next: (newUser) => {
        if (newUser) {
          if (!this.user || newUser.email !== this.user.email) {
            this.initializeForCurrentUser();
          }
        } else {
          this.user = null;
          this.router.navigate(['/login']);
        }
      },
    });
    this.initializeForCurrentUser();
  }

  ionViewWillEnter() {
    this.initializeForCurrentUser();
  }

  ngOnDestroy() {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
    if (this.formChangesSub) {
      this.formChangesSub.unsubscribe();
    }
  }

  private formChangesSub?: any;
  private userSub?: any;

  private initializeForCurrentUser() {
    this.user = this.authService.currentUserValue;
    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }

    this.hasChanges = false;
    if (this.formChangesSub) {
      this.formChangesSub.unsubscribe();
    }
    this.initForm();
    this.loadLatestProfile();

    this.formChangesSub = this.profileForm.valueChanges.subscribe(() => {
      this.hasChanges = true;
    });
  }

  loadLatestProfile() {
    if (!this.user?.email) return;
    this.isLoading = true;
    this.authService.fetchUserProfile(this.user.email).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res && res.user) {
          this.user = res.user;
          this.populateForm();
        }
      },
    });
  }

  initForm() {
    const userEmail = this.user?.email || '';
    if (this.user?.role === 'influencer') {
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
          instagramConnectToken: [''],
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

  populateForm() {
    if (!this.user) return;

    let imageUrl =
      (this.user as any).companyLogo ||
      (this.user as any).profilePicture ||
      this.user.avatar ||
      '';
    if (
      imageUrl &&
      !imageUrl.startsWith('http') &&
      !imageUrl.startsWith('data:')
    ) {
      imageUrl = `http://localhost:3000/${imageUrl}`;
    }
    this.avatarBase64 = imageUrl;

    this.selectedNiches = [...((this.user.niches as Niche[]) || [])];
    this.selectedCountries = [...((this.user.countries as Country[]) || [])];
    if (this.user.role === 'influencer') {
      this.profileForm.patchValue({
        name: this.user.name || '',
        username: this.user.username || '',
        phone: this.user.phone || '',
        bio: this.user.bio || '',
        instagramUsername: this.user.instagramUsername || '',
        instagramFollowers: this.user.instagramFollowers || null,
        instagramConnectToken: this.user.instagramAccessToken || '',
        youtubeUsername: this.user.youtubeUsername || '',
        youtubeFollowers: this.user.youtubeFollowers || null,
        twitterUsername: this.user.twitterUsername || '',
        twitterFollowers: this.user.twitterFollowers || null,
      });
      this.instagramConnectToken = this.user.instagramAccessToken || '';

      const linksArray = this.pastWorkLinks;
      while (linksArray.length !== 0) {
        linksArray.removeAt(0);
      }

      if (this.user.pastWorkLinks && this.user.pastWorkLinks.length > 0) {
        this.user.pastWorkLinks.forEach((link) => {
          this.addPastWorkLink(link);
        });
      }
    } else {
      this.profileForm.patchValue({
        phone: this.user.phone || '',
        firstName: this.user.firstName || '',
        lastName: this.user.lastName || '',
        companyName: this.user.companyName || '',
        brandDescription: this.user.brandDescription || '',
        website: this.user.website || '',
        industry: this.user.industry || '',
        minBudget: this.user.minBudget ?? null,
        maxBudget: this.user.maxBudget ?? null,
      });
    }
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
    this.hasChanges = true;
  }

  isNicheSelected(niche: string): boolean {
    return this.selectedNiches.includes(niche as Niche);
  }

  toggleCountry(country: string) {
    const countryEnum = country as Country;
    const index = this.selectedCountries.indexOf(countryEnum);
    if (index > -1) {
      this.selectedCountries.splice(index, 1);
    } else {
      this.selectedCountries.push(countryEnum);
    }
    this.hasChanges = true;
  }

  isCountrySelected(country: string): boolean {
    return this.selectedCountries.includes(country as Country);
  }

  onAvatarSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.avatarFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        // this.avatarBase64 = reader.result as string;
        this.hasChanges = true;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    if (this.user?.role === 'influencer') {
      if (this.selectedNiches.length === 0) {
        return;
      }
      if (this.selectedCountries.length === 0) {
        return;
      }
    }

    this.isLoading = true;

    const formValues = this.profileForm.getRawValue();
    const formData = new FormData();

    if (formValues.phone) formData.append('phone', formValues.phone);

    if (this.user?.role === 'influencer') {
      if (formValues.name) formData.append('name', formValues.name);
      if (formValues.username) formData.append('username', formValues.username);
      if (formValues.bio) formData.append('bio', formValues.bio);
      formData.append('niches', JSON.stringify(this.selectedNiches));
      formData.append('countries', JSON.stringify(this.selectedCountries));
      if (formValues.instagramUsername)
        formData.append('instagramUsername', formValues.instagramUsername);
      if (
        formValues.instagramFollowers !== null &&
        formValues.instagramFollowers !== undefined
      )
        formData.append(
          'instagramFollowers',
          formValues.instagramFollowers.toString(),
        );
      if (formValues.youtubeUsername)
        formData.append('youtubeUsername', formValues.youtubeUsername);
      if (
        formValues.youtubeFollowers !== null &&
        formValues.youtubeFollowers !== undefined
      )
        formData.append(
          'youtubeFollowers',
          formValues.youtubeFollowers.toString(),
        );
      if (formValues.twitterUsername)
        formData.append('twitterUsername', formValues.twitterUsername);
      if (
        formValues.twitterFollowers !== null &&
        formValues.twitterFollowers !== undefined
      )
        formData.append(
          'twitterFollowers',
          formValues.twitterFollowers.toString(),
        );
      if (formValues.pastWorkLinks && formValues.pastWorkLinks.length > 0)
        formData.append(
          'pastWorkLinks',
          JSON.stringify(formValues.pastWorkLinks),
        );

      if (this.avatarFile) {
        formData.append('profilePicture', this.avatarFile);
      }
    } else {
      formData.append('name', `${formValues.firstName} ${formValues.lastName}`);
      if (formValues.firstName)
        formData.append('firstName', formValues.firstName);
      if (formValues.lastName) formData.append('lastName', formValues.lastName);
      if (formValues.companyName)
        formData.append('companyName', formValues.companyName);
      if (formValues.brandDescription)
        formData.append('brandDescription', formValues.brandDescription);
      if (formValues.website) formData.append('website', formValues.website);
      if (formValues.industry) formData.append('industry', formValues.industry);
      if (formValues.minBudget !== null && formValues.minBudget !== undefined)
        formData.append('minBudget', formValues.minBudget.toString());
      if (formValues.maxBudget !== null && formValues.maxBudget !== undefined)
        formData.append('maxBudget', formValues.maxBudget.toString());

      if (this.avatarFile) {
        formData.append('companyLogo', this.avatarFile);
      }
    }

    this.authService.updateProfile(formData).subscribe({
      next: (res) => {
        if (res && res.user) {
          this.user = res.user;
          this.avatarFile = null;
          this.populateForm();
        }

        this.profileForm.markAsPristine();
        this.hasChanges = false;

        if (this.formChangesSub) {
          this.formChangesSub.unsubscribe();
        }

        this.formChangesSub = this.profileForm.valueChanges.subscribe(() => {
          this.hasChanges = true;
        });
      },
      error: (err) => {},
    });
  }

  connectInstagram() {
    const token = this.profileForm.get('instagramConnectToken')?.value;
    if (!token) return;
    this.isConnectingInstagram = true;
    this.authService.connectInstagram(token).subscribe({
      next: (res) => {
        this.isConnectingInstagram = false;
        if (res && res.user) {
          this.user = res.user;
          this.populateForm();
        }
      },
      error: (err) => {
        this.isConnectingInstagram = false;
        console.error(err);
      },
    });
  }

  syncInstagramCatalogue() {
    this.isSyncingInstagram = true;
    this.authService.syncInstagramCatalogue().subscribe({
      next: (res) => {
        this.isSyncingInstagram = false;
        if (res && res.user) {
          this.user = res.user;
          this.populateForm();
        }
      },
      error: (err) => {
        this.isSyncingInstagram = false;
        console.error('Sync failed', err);
      },
    });
  }

  onCatalogueMediaSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.isUploadingMedia = true;
      this.authService.uploadCatalogueMedia(file).subscribe({
        next: (res) => {
          this.isUploadingMedia = false;
          if (res && res.user) {
            this.user = res.user;
            this.populateForm();
          }
        },
        error: (err) => {
          this.isUploadingMedia = false;
          console.error('Upload failed', err);
        },
      });
    }
  }

  logout() {
    this.authService.logout();
  }
}
