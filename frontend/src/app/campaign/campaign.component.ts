import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService, User } from '../services/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Niche, Platform, CampaignStatus, Industry } from '.././models/enums';
import { Campaign } from '.././models/interfaces';

const INDUSTRY_TO_NICHE: Record<string, string> = {
  [Industry.FASHION]: Niche.FASHION,
  [Industry.TECHNOLOGY]: Niche.TECH,
  [Industry.FOOD]: Niche.FOOD,
  [Industry.FITNESS]: Niche.FITNESS,
  [Industry.TRAVEL]: Niche.TRAVEL,
  [Industry.BEAUTY]: Niche.BEAUTY,
  [Industry.GAMING]: Niche.GAMING,
  [Industry.MUSIC]: Niche.MUSIC,
  [Industry.LIFESTYLE]: Niche.LIFESTYLE,
  [Industry.EDUCATION]: Niche.EDUCATION,
  [Industry.BUSINESS]: Niche.BUSINESS,
  [Industry.ENTERTAINMENT]: Niche.ENTERTAINMENT,
  [Industry.HEALTH]: Niche.HEALTH,
  [Industry.SPORTS]: Niche.SPORTS,
  [Industry.PHOTOGRAPHY]: Niche.PHOTOGRAPHY,
  [Industry.ART]: Niche.ART,
  [Industry.OTHER]: Niche.OTHER,
};

const NICHE_TO_INDUSTRY: Record<string, string> = Object.entries(
  INDUSTRY_TO_NICHE,
).reduce(
  (acc, [industry, niche]) => ({ ...acc, [niche]: industry }),
  {} as Record<string, string>,
);

@Component({
  selector: 'app-campaign',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    IonicModule,
  ],
  templateUrl: './campaign.component.html',
  styleUrls: ['./campaign.component.scss'],
})
export class CampaignComponent implements OnInit, OnDestroy {
  user: User | null = null;
  campaigns: Campaign[] = [];
  filteredCampaigns: Campaign[] = [];
  showCreateForm = false;
  campaignForm!: FormGroup;
  isLoading = false;
  selectedCampaign: Campaign | null = null;
  applicationMessage = '';

  activeTab: 'discover' | 'applied' = 'discover';
  selectedNiche = 'all';
  selectedPlatform = 'all';
  selectedSort = 'newest';

  nicheOptions = Object.values(Niche);
  platformOptions = Object.values(Platform);

  get sidebarNicheLabel(): string {
    return this.user?.role === 'brand' ? 'Industry' : 'Niche';
  }

  get sidebarOtherLabel(): string {
    return this.user?.role === 'brand' ? 'Other Industries' : 'Other Niches';
  }

  /**
   * Returns the human-readable display name for a niche value.
   * For brands it shows the Industry label; for influencers it shows
   * the titlecased niche string (handled by | titlecase in the template).
   */
  getNicheDisplayName(niche: string): string {
    if (this.user?.role === 'brand') {
      return NICHE_TO_INDUSTRY[niche] ?? niche;
    }
    // Influencer: return raw niche; template applies | titlecase
    return niche;
  }

  get sortedNicheOptions(): string[] {
    const all = Object.values(Niche);
    let preferred: string[] = [];
    if (this.user?.role === 'brand' && this.user.industry) {
      // Map brand's Industry to the corresponding Niche key
      const matchedNiche = INDUSTRY_TO_NICHE[this.user.industry as string];
      if (matchedNiche) {
        const found = all.find(
          (n) => n.toLowerCase() === matchedNiche.toLowerCase(),
        );
        if (found) preferred = [found];
      }
    } else if (this.user?.role === 'influencer' && this.user.niches?.length) {
      preferred = all.filter((n) =>
        (this.user!.niches as string[]).some(
          (un) => un.toLowerCase() === n.toLowerCase(),
        ),
      );
    }

    const rest = all.filter((n) => !preferred.includes(n));
    return [...preferred, ...rest];
  }

  get preferredNicheCount(): number {
    const all = Object.values(Niche);
    if (this.user?.role === 'brand' && this.user.industry) {
      const matchedNiche = INDUSTRY_TO_NICHE[this.user.industry as string];
      if (!matchedNiche) return 0;
      const found = all.find(
        (n) => n.toLowerCase() === matchedNiche.toLowerCase(),
      );
      return found ? 1 : 0;
    } else if (this.user?.role === 'influencer' && this.user.niches?.length) {
      return all.filter((n) =>
        (this.user!.niches as string[]).some(
          (un) => un.toLowerCase() === n.toLowerCase(),
        ),
      ).length;
    }
    return 0;
  }

  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
  ) {}

  private userSub!: any;

  ngOnInit() {
    this.userSub = this.authService.currentUser$.subscribe((u) => {
      if (u) {
        const isNewUser = !this.user || this.user.email !== u.email;
        this.user = u;
        if (isNewUser) {
          this.initForm();
          this.loadCampaigns();
        }
      } else {
        this.user = null;
        this.campaigns = [];
        this.filteredCampaigns = [];
        this.selectedCampaign = null;
        this.router.navigate(['/login']);
      }
    });
  }

  ionViewWillEnter() {
    const latestUser = this.authService.currentUserValue;
    if (latestUser) {
      this.user = latestUser;
    }
    if (this.user) {
      this.loadCampaigns();
    }
  }

  ngOnDestroy() {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }

  private getHeaders() {
    const token = this.authService.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  initForm() {
    this.campaignForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      niche: ['', Validators.required],
      platform: [Platform.INSTAGRAM, Validators.required],
      budget: [null, [Validators.required, Validators.min(1)]],
      maxApplicants: [null, [Validators.required, Validators.min(1)]],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      deliverables: ['', Validators.required],
      requirements: ['', Validators.required],
    });
  }

  loadCampaigns() {
    this.isLoading = true;
    this.http
      .get<any>(`${this.apiUrl}/campaigns`, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          this.campaigns = res.campaigns || [];
          this.applyFilters();
          if (this.selectedCampaign) {
            const refreshed = this.campaigns.find(
              (c) => c._id === this.selectedCampaign!._id,
            );
            if (refreshed) this.selectedCampaign = refreshed;
          }
        },
        error: (err) => {
          this.isLoading = false;
          if (err.status === 401) {
            this.authService.logout();
          }
        },
      });
  }

  applyFilters() {
    let result = [...this.campaigns];

    if (this.activeTab === 'applied') {
      result = result.filter((c) => this.hasApplied(c));
    }

    if (this.selectedNiche !== 'all') {
      result = result.filter(
        (c) => c.niche?.toLowerCase() === this.selectedNiche.toLowerCase(),
      );
    }

    if (this.selectedPlatform !== 'all') {
      result = result.filter(
        (c) =>
          (c.platform || 'Instagram').toLowerCase() ===
          this.selectedPlatform.toLowerCase(),
      );
    }

    if (this.selectedSort === 'budget-high') {
      result.sort((a, b) => b.budget - a.budget);
    } else if (this.selectedSort === 'budget-low') {
      result.sort((a, b) => a.budget - b.budget);
    } else {
      result.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );
    }

    this.filteredCampaigns = result;
  }

  setTab(tab: 'discover' | 'applied') {
    this.activeTab = tab;
    this.applyFilters();
  }

  setNiche(niche: string) {
    this.selectedNiche = niche;
    this.applyFilters();
  }

  get appliedCount(): number {
    return this.campaigns.filter((c) => this.hasApplied(c)).length;
  }

  toggleCreateForm() {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) this.campaignForm.reset();
  }

  onCreateCampaign() {
    if (this.campaignForm.invalid) {
      this.campaignForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    const payload = {
      ...this.campaignForm.value,
      brandEmail: this.user?.email,
    };
    this.http
      .post<any>(`${this.apiUrl}/campaigns`, payload, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.showCreateForm = false;
          this.campaignForm.reset();
          this.loadCampaigns();
        },
        error: (err) => {
          this.isLoading = false;
        },
      });
  }

  updateApplication(app: any, newStatus: 'accepted' | 'rejected') {
    if (!this.selectedCampaign?._id || !app?.influencerEmail) {
      return;
    }
    const emailLower = app.influencerEmail.toLowerCase().trim();
    const url = `${this.apiUrl}/campaigns/${this.selectedCampaign._id}/applications/${encodeURIComponent(emailLower)}/status`;
    this.isLoading = true;
    this.http
      .put<any>(url, { status: newStatus }, { headers: this.getHeaders() })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.loadCampaigns();
        },
        error: (err) => {
          console.error('updateApplication error:', err);
          this.isLoading = false;
          if (err.status === 401) {
            this.authService.logout();
          }
        },
      });
  }

  updateCampaignStatus(status: CampaignStatus | string) {
    if (!this.selectedCampaign?._id) return;

    this.isLoading = true;

    this.http
      .put<any>(
        `${this.apiUrl}/campaigns/${this.selectedCampaign._id}/status`,
        { status },
        { headers: this.getHeaders() },
      )
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.loadCampaigns();
        },
        error: (err) => {
          this.isLoading = false;
          if (err.status === 401) {
            this.authService.logout();
          }
        },
      });
  }

  applyToCampaign(campaign: Campaign) {
    if (!this.applicationMessage.trim()) {
      return;
    }
    this.isLoading = true;

    this.http
      .post<any>(
        `${this.apiUrl}/campaigns/${campaign._id}/apply`,
        { message: this.applicationMessage },
        { headers: this.getHeaders() },
      )
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.selectedCampaign = null;
          this.applicationMessage = '';
          this.loadCampaigns();
        },
        error: (err) => {
          this.isLoading = false;
        },
      });
  }

  viewCampaignDetails(campaign: Campaign) {
    this.selectedCampaign = campaign;
    this.applicationMessage = '';
  }

  closeDetails() {
    this.selectedCampaign = null;
  }

  hasApplied(campaign: Campaign): boolean {
    return (
      campaign.applications?.some(
        (a: any) => a.influencerEmail === this.user?.email,
      ) || false
    );
  }

  getApplicationStatus(campaign: Campaign): string {
    const app = campaign.applications?.find(
      (a: any) => a.influencerEmail === this.user?.email,
    );
    return app?.status || '';
  }

  getBrandInitial(campaign: Campaign): string {
    const name = campaign.brandName || campaign.brandEmail || 'B';
    return name.charAt(0).toUpperCase();
  }

  getCampaignTimingStatus(campaign: Campaign): string {
    if (!campaign.startDate || !campaign.endDate) return 'No dates set';

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const today = now.getTime();

    const startObj = new Date(campaign.startDate);
    startObj.setHours(0, 0, 0, 0);
    const start = startObj.getTime();

    const endObj = new Date(campaign.endDate);
    endObj.setHours(0, 0, 0, 0);
    const end = endObj.getTime();

    if (today < start) {
      const diff = Math.ceil((start - today) / (1000 * 60 * 60 * 24));
      return `Starts in ${diff} day${diff !== 1 ? 's' : ''}`;
    } else if (today <= end) {
      const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
      return `${diff} day${diff !== 1 ? 's' : ''} left`;
    } else {
      return 'Ended';
    }
  }

  getApplicantCount(campaign: Campaign): number {
    return campaign.applications?.length || 0;
  }

  getMaxApplicants(campaign: Campaign): number {
    return campaign.maxApplicants ?? 0;
  }

  getProgressWidth(campaign: Campaign): number {
    const pct =
      (this.getApplicantCount(campaign) / this.getMaxApplicants(campaign)) *
      100;
    return Math.min(pct, 100);
  }

  logout() {
    this.authService.logout();
  }
}
