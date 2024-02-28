import { Injectable } from '@angular/core';

import { Observable, Subject, from, tap } from 'rxjs';
import { IUser } from '../interfaces/user';
import { environment } from '../../environments/environment';

import { createClient } from '@supabase/supabase-js'
import { HttpClient, HttpHeaders } from '@angular/common/http';
const emptyUser: IUser = {id: '0', avatar_url: 'assets/logo.svg', full_name: 'none', username: 'none' }

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  supaClient: any = null;
  urlAvatar!: string;

  constructor(private http: HttpClient) {
    this.supaClient = createClient(environment.supabaseUrl, environment.supabaseKey);
  }
  async register(email: string, password: string, fullName: string):Promise<boolean>{
    let session = await this.supaClient.auth.getSession();
    let data, error;
    if(session.data.session){
      data = session.data.session;
    }
    else{
      session = await this.supaClient.auth.signUp({
        email,
        password
      });
      data = session.data;
      error = session.error;
      if(error){
     //   throw error;
     return false
      }
    }
    if(data.user != null){
      const { user } = data;
        const { id } = user;
        const { error: insertError } = await this.supaClient
            .from('users')
            .insert([{ id, email, password, full_name: fullName}]);

        if (insertError) {
            console.error("Error inserting user data:", insertError.message);
            return false;
        }
      this.getProfile(data.user.id);
      return true;
    }
    return false;
  }
  
  userSubject: Subject<IUser> = new Subject;
  favoritesSubject: Subject<{id:number,uid:string,artwork_id:string}[]> = new Subject;

  async login(email: string, password: string):Promise<boolean>{
    console.log("Login function called");
        let session = await this.supaClient.auth.getSession();
        let data, error;
        if(session.data.session){
          data = session.data.session;
        }
        else{
          session = await this.supaClient.auth.signInWithPassword({
            email,
            password
          });
          data = session.data;
          error = session.error;
          if(error){
         //   throw error;
         return false
          }
        }
        if(data.user != null){
          this.getProfile(data.user.id);
          return true;
        }
      return false;
  }

  getProfile(userId:string): void{

    let profilePromise: Promise<{data: IUser[]}> = this.supaClient
    .from('users')
    .select("*")
    // Filters
    .eq('id', userId);

    from(profilePromise).pipe(
      tap(data => console.log(data))
      ).subscribe(async (profile:{data: IUser[]}) =>{
        this.userSubject.next(profile.data[0]);
        const avatarFile = profile.data[0].avatar_url.split('/').at(-1);
        const { data, error } = await this.supaClient.storage.from('avatars').download(avatarFile);
        const url = URL.createObjectURL(data)
        profile.data[0].avatar_url = url;
        this.userSubject.next(profile.data[0]);
      }

      );

  }

  async isUserLoggedIn(): Promise<boolean> {
    try {
      const { data, error } = await this.supaClient.auth.getSession();
      if (data.session) {
        this.getProfile(data.session.user.id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking user authentication status:', error);
      return false;
    }
  }
  
  async isLogged(){
    let {data,error} = await this.supaClient.auth.getSession();
    if(data.session){
      this.getProfile(data.session.user.id)
    }
  }

  async logout(){
    const { error } = await this.supaClient.auth.signOut();
    this.userSubject.next(emptyUser);
  }

  async getCurrentUserId(): Promise<string> {
    const {data,error} = await this.supaClient.auth.getSession();
    if (data.session) {
      return data.session.user.id;
    } else {
      throw new Error("No se pudo obtener el ID de usuario.");
    }
  }

  async getFavorites(uid: string): Promise<void> {
    const { data, error } = await this.supaClient
        .from('users')
        .select('favorite_paintings')
        .eq('id', uid);

    if (error) {
        console.error('Error fetching favorites:', error.message);
        return;
    }

    if (data && data.length > 0) {
        const favoritePaintings = data[0].favorite_paintings;
        this.favoritesSubject.next(favoritePaintings);
    }
}

  async addFavorite(artworkId: string): Promise<void> {
    const { data, error } = await this.supaClient.auth.getSession();
    if (error) {
        console.error("Error getting session:", error.message);
        return;
    }

    const userId = data.session.user.id;
    console.log("userId: " + userId);

    const { data: userData, error: userError } = await this.supaClient
        .from('users')
        .select('favorite_paintings')
        .eq('id', userId)
        .single();

    if (userError) {
        console.error("Error getting user data:", userError.message);
        return;
    }

    const favoritePaintings: string[] = userData.favorite_paintings || [];

    favoritePaintings.push(artworkId);

    const { error: updateError } = await this.supaClient
        .from('users')
        .update({ favorite_paintings: favoritePaintings })
        .eq('id', userId);

    if (updateError) {
        console.error("Error adding favorite:", updateError.message);
        return;
    }

    console.log("Guardado Correctamente");

    this.getFavorites(userId);
  }
  
  async removeFavorite(artworkId: string): Promise<void> {
    const { data, error } = await this.supaClient.auth.getSession();
    if (error) {
        console.error("Error getting session:", error.message);
        return;
    }

    const userId = data.session.user.id;

    const { data: userData, error: userError } = await this.supaClient
        .from('users')
        .select('favorite_paintings')
        .eq('id', userId)
        .single();

    if (userError) {
        console.error("Error getting user data:", userError.message);
        return;
    }

    const favoritePaintings: string[] = userData.favorite_paintings || [];

    const updatedFavoritePaintings = favoritePaintings.filter(id => id !== artworkId);

    const { error: updateError } = await this.supaClient
        .from('users')
        .update({ favorite_paintings: updatedFavoritePaintings })
        .eq('id', userId);

    if (updateError) {
        console.error("Error removing favorite:", updateError.message);
        return;
    }
    console.log("Borrado Correctamente");

    this.getFavorites(userId);
}
setUrlAvatar(urlAvatar:string) {
  this.urlAvatar=urlAvatar;
}
async uploadImageToSupabase(file: File): Promise<string> {
  try {
    this.setUrlAvatar('https://mmieveysqvbukjpwolwj.supabase.co/storage/v1/object/avatars/'+file.name);

    const { data, error } = await this.supaClient.storage
      .from('avatars')
      .upload(`/${file.name}`, file);

    if (error) {
      throw new Error('Error uploading image to Supabase');
    }

    return data.url;
  } catch (error) {
    console.error('Error uploading image to Supabase:', error);
    throw error;
  }
}

async updateProfile(profileData: any): Promise<any> {
  
  let { data, error } = await this.supaClient.auth.getSession();
   console.log("url ", this.urlAvatar);
  let promiseUpdate: Promise<boolean> = this.supaClient
    .from('users')
    .update({
      username: profileData.username,
      full_name: profileData.full_name,
      avatar_url: this.urlAvatar
      // website: profileData.website
    })
    .eq('id', data.session.user.id);
  
  promiseUpdate.then(() => this.getProfile(data.session.user.id));
}



}




/*
npm install @supabase/supabase-js

*/
