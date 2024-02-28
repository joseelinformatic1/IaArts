import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { UsersService } from '../../services/users.service';
import { IUser } from '../../interfaces/user';
import { map } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {

  constructor(private formBuilder: FormBuilder, private userService: UsersService) {
    this.createForm();
  }

  formulario!: FormGroup;
  isLoggedIn = false;

  avatarFile: File | null = null;

  ngOnInit(): void {
    this.userService.isLogged().then(() => this.isLoggedIn = true)
    .catch(() => this.isLoggedIn = false);
    this.userService.userSubject
    .pipe(map((p:IUser) => {return {
      id: p.id, 
      username: p.username, 
      full_name: p.full_name,
      avatar_url: p.avatar_url
      // website: p.website
    }}))
    .subscribe(profile => this.formulario.setValue(profile))
  }

  createForm() {
    this.formulario = this.formBuilder.group({
      id: [''],
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.pattern('.*[a-zA-Z].*'),
        ],
      ],
      full_name: [''],
      avatar_url: ['']
    });
  }

  async submitForm() {
    console.log('Form data:', this.formulario.value);
    if (this.formulario.valid) {
      if (await this.userService.isUserLoggedIn()) {
      this.saveProfile();
    } else {
      console.log('The user is not authenticated. Profile cannot be saved.');
    }
  }
}
  
  private saveProfile(): void {
    const profileData = this.formulario.value;
    console.log('Avatar file:', this.avatarFile);
    if (this.avatarFile) {
      this.userService.uploadImageToSupabase(this.avatarFile);
    }
    this.updateProfile(profileData);
  }
  
  private updateProfile(profileData: any): void {
    this.userService.updateProfile(profileData)
      .then(() => {
        console.log('Profile updated successfully');
        // location.reload();
      })
      .catch(error => {
        console.error('Error updating profile:', error);
      });
  }
  

  get usernameNoValid() {
    return (
      this.formulario.get('username')!.invalid &&
      this.formulario.get('username')!.touched
    );
  }

  uploadImage(event: any): void {
    this.avatarFile = event.target.files[0];
    if (!this.avatarFile) {
      return;
    }
  
    if (!this.avatarFile.type.startsWith('image/')) {
      console.error('The selected file is not an image.');
      return;
    }
  
    const reader = new FileReader();
    reader.onload = () => {
      this.showImage(reader.result as string);
    };
    reader.readAsDataURL(this.avatarFile);
  }
  showImage(imageData: string): void {
    this.formulario.patchValue({
      avatar_url: imageData
    });
  }
  

}

// function websiteValidator(pattern: string): ValidatorFn {
//   return (c: AbstractControl): { [key: string]: any } | null => {
//     if (c.value) {
//       let regexp = new RegExp(pattern);

//       return regexp.test(c.value) ? null : { website: c.value };
//     }
//     return null;
//   };
// }
