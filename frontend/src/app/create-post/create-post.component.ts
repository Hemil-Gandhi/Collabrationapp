import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterModule],
  templateUrl: './create-post.component.html',
  styleUrls: ['./create-post.component.scss'],
})
export class CreatePostComponent {
  postImageFile: File | null = null;
  postImagePreview: string | null = null;
  caption = '';
  aiPrompt = '';
  
  isGenerating = false;
  isSubmitting = false;
  showAiPanel = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.postImageFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.postImagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  toggleAiPanel() {
    this.showAiPanel = !this.showAiPanel;
    if (this.showAiPanel) {
      this.aiPrompt = '';
    }
  }

  generateAiCaption() {
    if (!this.aiPrompt.trim()) return;

    this.isGenerating = true;
    this.errorMessage = '';

    this.authService.generateCaption(this.aiPrompt, this.caption).subscribe({
      next: (res) => {
        this.caption = res.caption;
        this.isGenerating = false;
        this.showAiPanel = false;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Failed to generate caption.';
        this.isGenerating = false;
      }
    });
  }

  submitPost() {
    if (!this.postImageFile) {
      this.errorMessage = 'Please select an image for your post.';
      return;
    }
    if (!this.caption.trim()) {
      this.errorMessage = 'Please write a caption.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const formData = new FormData();
    formData.append('postImage', this.postImageFile);
    formData.append('caption', this.caption);

    this.authService.createPost(formData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/profile-page']);
      },
      error: (err) => {
        this.errorMessage = err.message || 'Failed to create post.';
        this.isSubmitting = false;
      }
    });
  }
}
