"use client";
import {createContext,useContext,useEffect,useMemo,useState} from "react";import type{ReactNode}from"react";
export type Language="ar"|"en";const Context=createContext<{lang:Language;toggle:()=>void}|null>(null);
export function LanguageProvider({children}:{children:ReactNode}){const[lang,setLang]=useState<Language>("ar");useEffect(()=>{const saved=localStorage.getItem("iard-language");if(saved==="ar"||saved==="en"){
// eslint-disable-next-line react-hooks/set-state-in-effect
setLang(saved)}},[]);useEffect(()=>{document.documentElement.lang=lang;document.documentElement.dir=lang==="ar"?"rtl":"ltr";localStorage.setItem("iard-language",lang)},[lang]);const value=useMemo(()=>({lang,toggle:()=>setLang(v=>v==="ar"?"en":"ar")}),[lang]);return <Context.Provider value={value}>{children}</Context.Provider>}
export function useLanguage(){const value=useContext(Context);if(!value)throw new Error("LanguageProvider missing");return value}
