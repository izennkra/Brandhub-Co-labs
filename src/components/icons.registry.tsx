/* Central Icons © iconists. Licensed artwork. All rights reserved.
https://iconists.co/license
 */
// Registre local des icônes VisualSystem (set Central), copiées une par une depuis
// https://visual.systems/api/modules/icon/central/<nom>.jsx — variantes radius-2, trait 1,5 et 2.
// N'ajouter que les icônes utilisées par le produit (voir CLAUDE.md, section Icônes).
import type { ReactNode } from 'react';

export type Artwork = (id: string) => ReactNode;
export type IconDefinition = { viewBox: string; stroke15: Artwork; stroke2: Artwork };

export const icons = {
  toolbox: {
    viewBox: '0 0 24 24',
    stroke15: (_id) => (
      <>
        <g>
          <path
            d="M2.75 10.75H21.25V18.25C21.25 19.3546 20.3546 20.25 19.25 20.25H4.75C3.64543 20.25 2.75 19.3546 2.75 18.25V10.75Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12.75 10.75V4.75C12.75 3.64543 13.6454 2.75 14.75 2.75H17.25C18.3546 2.75 19.25 3.64543 19.25 4.75V10.75"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12.75 6.75H15.25"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4.75 10.75V6.50424C4.75 6.17326 4.83214 5.84745 4.98906 5.55604L6.26295 3.19024C6.40895 2.91909 6.69204 2.75 7 2.75C7.30796 2.75 7.59105 2.91909 7.73705 3.19024L9.01094 5.55604C9.16786 5.84745 9.25 6.17326 9.25 6.50424V10.75"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </>
    ),
    stroke2: (_id) => (
      <>
        <g>
          <path
            d="M3 11H21V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V11Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13 11V4C13 3.44772 13.4477 3 14 3H18C18.5523 3 19 3.44772 19 4V11"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13.0039 7H15.0039"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5.00391 11V6.20156C5.00391 5.74742 5.15847 5.3068 5.44217 4.95217L6.69156 3.39043C6.88898 3.14366 7.18788 3 7.50391 3C7.81994 3 8.11883 3.14366 8.31625 3.39043L9.56564 4.95217C9.84934 5.3068 10.0039 5.74742 10.0039 6.20156V11"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </>
    ),
  },
  books: {
    viewBox: '0 0 24 24',
    stroke15: (_id) => (
      <>
        <g>
          <path
            d="M2.75 6.75C2.75 6.19772 3.19772 5.75 3.75 5.75H5.75C6.30228 5.75 6.75 6.19772 6.75 6.75V19.25C6.75 19.8023 6.30228 20.25 5.75 20.25H3.75C3.19772 20.25 2.75 19.8023 2.75 19.25V6.75Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
            strokeLinejoin="round"
          />
          <path
            d="M14.257 8.46569C14.114 7.93222 14.4306 7.38388 14.9641 7.24094L17.3789 6.59389C17.9124 6.45095 18.4607 6.76753 18.6036 7.301L21.5801 18.4091C21.723 18.9426 21.4064 19.4909 20.873 19.6339L18.4581 20.2809C17.9247 20.4239 17.3763 20.1073 17.2334 19.5738L14.257 8.46569Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
            strokeLinejoin="round"
          />
          <path
            d="M6.75 4.75C6.75 4.19772 7.19772 3.75 7.75 3.75H12.25C12.8023 3.75 13.25 4.19772 13.25 4.75V19.25C13.25 19.8023 12.8023 20.25 12.25 20.25H7.75C7.19772 20.25 6.75 19.8023 6.75 19.25V4.75Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
            strokeLinejoin="round"
          />
          <path
            d="M6.75 7.875H13.25"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
            strokeLinejoin="round"
          />
          <path
            d="M6.75 16.125H13.25"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
            strokeLinejoin="round"
          />
        </g>
      </>
    ),
    stroke2: (_id) => (
      <>
        <g>
          <path
            d="M3 7C3 6.44772 3.44772 6 4 6H6C6.55228 6 7 6.44772 7 7V19C7 19.5523 6.55228 20 6 20H4C3.44772 20 3 19.5523 3 19V7Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
            strokeLinejoin="round"
          />
          <path
            d="M17.2827 6.65444L15.3508 7.17208C14.8173 7.31502 14.5008 7.86336 14.6437 8.39682L17.5554 19.2635C17.6984 19.797 18.2467 20.1135 18.7802 19.9706L20.712 19.453C21.2455 19.31 21.5621 18.7617 21.4191 18.2282L18.5074 7.36155C18.3645 6.82808 17.8161 6.5115 17.2827 6.65444Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
            strokeLinejoin="round"
          />
          <path
            d="M7 5C7 4.44772 7.44772 4 8 4H12C12.5523 4 13 4.44772 13 5V19C13 19.5523 12.5523 20 12 20H8C7.44772 20 7 19.5523 7 19V5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
            strokeLinejoin="round"
          />
          <path
            d="M7 8H13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
            strokeLinejoin="round"
          />
          <path
            d="M7 16H13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
            strokeLinejoin="round"
          />
        </g>
      </>
    ),
  },
  'circle-dashed': {
    viewBox: '0 0 24 24',
    stroke15: (_id) => (
      <>
        <g>
          <path
            d="M21.25 12C21.25 17.1086 17.1086 21.25 12 21.25C6.89137 21.25 2.75 17.1086 2.75 12C2.75 6.89137 6.89137 2.75 12 2.75C17.1086 2.75 21.25 6.89137 21.25 12Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="3 4"
          />
        </g>
      </>
    ),
    stroke2: (_id) => (
      <>
        <g>
          <path
            d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="3 4"
          />
        </g>
      </>
    ),
  },
  'circles-three': {
    viewBox: '0 0 24 24',
    stroke15: (_id) => (
      <>
        <g>
          <path
            d="M12.75 7.75C12.75 10.5114 10.5114 12.75 7.75 12.75C4.98858 12.75 2.75 10.5114 2.75 7.75C2.75 4.98858 4.98858 2.75 7.75 2.75C10.5114 2.75 12.75 4.98858 12.75 7.75Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M17.5 17.75C17.5 19.683 15.933 21.25 14 21.25C12.067 21.25 10.5 19.683 10.5 17.75C10.5 15.817 12.067 14.25 14 14.25C15.933 14.25 17.5 15.817 17.5 17.75Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M21.25 9.25C21.25 10.7688 20.0188 12 18.5 12C16.9812 12 15.75 10.7688 15.75 9.25C15.75 7.73122 16.9812 6.5 18.5 6.5C20.0188 6.5 21.25 7.73122 21.25 9.25Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </g>
      </>
    ),
    stroke2: (_id) => (
      <>
        <g>
          <path
            d="M13 8C13 10.7614 10.7614 13 8 13C5.23858 13 3 10.7614 3 8C3 5.23858 5.23858 3 8 3C10.7614 3 13 5.23858 13 8Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M18 17.5C18 19.433 16.433 21 14.5 21C12.567 21 11 19.433 11 17.5C11 15.567 12.567 14 14.5 14C16.433 14 18 15.567 18 17.5Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M21 9.5C21 10.8807 19.8807 12 18.5 12C17.1193 12 16 10.8807 16 9.5C16 8.11929 17.1193 7 18.5 7C19.8807 7 21 8.11929 21 9.5Z"
            stroke="currentColor"
            strokeWidth="2"
          />
        </g>
      </>
    ),
  },
  bezier: {
    viewBox: '0 0 24 24',
    stroke15: (_id) => (
      <>
        <g>
          <path
            d="M3.75 4.75C3.75 4.19772 4.19772 3.75 4.75 3.75H7.25C7.80228 3.75 8.25 4.19772 8.25 4.75V7.25C8.25 7.80228 7.80228 8.25 7.25 8.25H4.75C4.19772 8.25 3.75 7.80228 3.75 7.25V4.75Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15.75 4.75C15.75 4.19772 16.1977 3.75 16.75 3.75H19.25C19.8023 3.75 20.25 4.19772 20.25 4.75V7.25C20.25 7.80228 19.8023 8.25 19.25 8.25H18H16.75C16.1977 8.25 15.75 7.80228 15.75 7.25V6V4.75Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3.75 16.75C3.75 16.1977 4.19772 15.75 4.75 15.75H7C7.55228 15.75 8 16.1977 8 16.75V19.25C8 19.8023 7.55228 20.25 7 20.25H4.75C4.19772 20.25 3.75 19.8023 3.75 19.25V16.75Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15.75 16.75C15.75 16.1977 16.1977 15.75 16.75 15.75H19.25C19.8023 15.75 20.25 16.1977 20.25 16.75V19.25C20.25 19.8023 19.8023 20.25 19.25 20.25H16.75C16.1977 20.25 15.75 19.8023 15.75 19.25V16.75Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15.75 6H8.25"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 8.25V15.75"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 18H15.75"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18 15.75V8.25"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </>
    ),
    stroke2: (_id) => (
      <>
        <g>
          <path
            d="M4 5C4 4.44772 4.44772 4 5 4H7C7.55228 4 8 4.44772 8 5V7C8 7.55228 7.55228 8 7 8H5C4.44772 8 4 7.55228 4 7V5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 5C16 4.44772 16.4477 4 17 4H19C19.5523 4 20 4.44772 20 5V7C20 7.55228 19.5523 8 19 8H18H17C16.4477 8 16 7.55228 16 7V6V5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 17C4 16.4477 4.44772 16 5 16H7C7.55228 16 8 16.4477 8 17V19C8 19.5523 7.55228 20 7 20H5C4.44772 20 4 19.5523 4 19V17Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 17C16 16.4477 16.4477 16 17 16H19C19.5523 16 20 16.4477 20 17V19C20 19.5523 19.5523 20 19 20H17C16.4477 20 16 19.5523 16 19V17Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 6H8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 8V16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 18H16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18 16V8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </>
    ),
  },
  'vector-logo': {
    viewBox: '0 0 24 24',
    stroke15: (_id) => (
      <>
        <g>
          <path
            d="M6.25 12C6.25 13.2426 5.24264 14.25 4 14.25C2.75736 14.25 1.75 13.2426 1.75 12C1.75 10.7574 2.75736 9.75 4 9.75C5.24264 9.75 6.25 10.7574 6.25 12Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
          <path
            d="M22.25 12C22.25 13.2426 21.2426 14.25 20 14.25C18.7574 14.25 17.75 13.2426 17.75 12C17.75 10.7574 18.7574 9.75 20 9.75C21.2426 9.75 22.25 10.7574 22.25 12Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
          <path d="M6.5 12H17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
          <path
            d="M3.58789 9.5C4.66683 5.88564 8.02516 3.25 12.0009 3.25C15.9767 3.25 19.335 5.88564 20.414 9.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
          <path
            d="M20.414 14.5C19.335 18.1144 15.9767 20.75 12.0009 20.75C8.02517 20.75 4.66684 18.1144 3.58789 14.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
        </g>
      </>
    ),
    stroke2: (_id) => (
      <>
        <g>
          <path
            d="M6 12C6 13.1046 5.10457 14 4 14C2.89543 14 2 13.1046 2 12C2 10.8954 2.89543 10 4 10C5.10457 10 6 10.8954 6 12Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
          />
          <path
            d="M22 12C22 13.1046 21.1046 14 20 14C18.8954 14 18 13.1046 18 12C18 10.8954 18.8954 10 20 10C21.1046 10 22 10.8954 22 12Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
          />
          <path d="M6.5 12H17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
          <path
            d="M3.75 9.875C4.69563 6.20889 8.03078 3.5 12 3.5C15.9692 3.5 19.3044 6.20889 20.25 9.875"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
          />
          <path
            d="M20.25 14.125C19.3044 17.7911 15.9692 20.5 12 20.5C8.03078 20.5 4.69563 17.7911 3.75 14.125"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
          />
        </g>
      </>
    ),
  },
  text1: {
    viewBox: '0 0 24 24',
    stroke15: (_id) => (
      <>
        <g>
          <path
            d="M3.75 6.25V3.75H12H20.25V6.25"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 20.25V3.75"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9.75 20.25H12H14.25"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </>
    ),
    stroke2: (_id) => (
      <>
        <g>
          <path
            d="M4 6V4H12H20V6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 20V4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 20H12H14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </>
    ),
  },
  'color-palette': {
    viewBox: '0 0 24 24',
    stroke15: (_id) => (
      <>
        <g>
          <path
            d="M21.25 12C21.25 19.1094 13.6572 12.7979 12 16.1176C10.9722 18.1765 14.9058 20.75 12 20.75C6.89137 20.75 2.75 16.8325 2.75 12C2.75 7.16751 6.89137 3.25 12 3.25C17.1086 3.25 21.25 7.16751 21.25 12Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M11.5 7.75C11.5 8.44036 10.9404 9 10.25 9C9.55964 9 9 8.44036 9 7.75C9 7.05964 9.55964 6.5 10.25 6.5C10.9404 6.5 11.5 7.05964 11.5 7.75Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M8.5 12C8.5 12.6904 7.94036 13.25 7.25 13.25C6.55964 13.25 6 12.6904 6 12C6 11.3096 6.55964 10.75 7.25 10.75C7.94036 10.75 8.5 11.3096 8.5 12Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M16.5 9.25C16.5 9.94036 15.9404 10.5 15.25 10.5C14.5596 10.5 14 9.94036 14 9.25C14 8.55964 14.5596 8 15.25 8C15.9404 8 16.5 8.55964 16.5 9.25Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </g>
      </>
    ),
    stroke2: (_id) => (
      <>
        <g>
          <path
            d="M3 12C3 16.6944 7.02944 20.5 12 20.5C14.8273 20.5 11 18 12 16C13.6125 12.7751 21 18.9062 21 12C21 7.30558 16.9706 3.5 12 3.5C7.02944 3.5 3 7.30558 3 12Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
          />
          <path
            d="M7.5 10.75C8.32843 10.75 9 11.4216 9 12.25C9 13.0784 8.32843 13.75 7.5 13.75C6.67157 13.75 6 13.0784 6 12.25C6 11.4216 6.67157 10.75 7.5 10.75Z"
            fill="currentColor"
          />
          <path
            d="M15.5 8C16.3284 8 17 8.67157 17 9.5C17 10.3284 16.3284 11 15.5 11C14.6716 11 14 10.3284 14 9.5C14 8.67157 14.6716 8 15.5 8Z"
            fill="currentColor"
          />
          <path
            d="M10.5 6.5C11.3284 6.5 12 7.17157 12 8C12 8.82843 11.3284 9.5 10.5 9.5C9.67157 9.5 9 8.82843 9 8C9 7.17157 9.67157 6.5 10.5 6.5Z"
            fill="currentColor"
          />
        </g>
      </>
    ),
  },
  'shapes-plus-x-square-circle': {
    viewBox: '0 0 24 24',
    stroke15: (_id) => (
      <>
        <g>
          <path
            d="M7.75 3.75C7.75 3.33579 7.41421 3 7 3C6.58579 3 6.25 3.33579 6.25 3.75H7.75ZM6.25 10.25C6.25 10.6642 6.58579 11 7 11C7.41421 11 7.75 10.6642 7.75 10.25H6.25ZM3.75 6.25C3.33579 6.25 3 6.58579 3 7C3 7.41421 3.33579 7.75 3.75 7.75V6.25ZM10.25 7.75C10.6642 7.75 11 7.41421 11 7C11 6.58579 10.6642 6.25 10.25 6.25V7.75ZM19.8284 15.2322C20.1213 14.9393 20.1213 14.4645 19.8284 14.1716C19.5355 13.8787 19.0607 13.8787 18.7678 14.1716L19.8284 15.2322ZM14.1716 18.7678C13.8787 19.0607 13.8787 19.5355 14.1716 19.8284C14.4645 20.1213 14.9393 20.1213 15.2322 19.8284L14.1716 18.7678ZM15.2322 14.1716C14.9393 13.8787 14.4645 13.8787 14.1716 14.1716C13.8787 14.4645 13.8787 14.9393 14.1716 15.2322L15.2322 14.1716ZM18.7678 19.8284C19.0607 20.1213 19.5355 20.1213 19.8284 19.8284C20.1213 19.5355 20.1213 19.0607 19.8284 18.7678L18.7678 19.8284ZM17 9.5C15.6193 9.5 14.5 8.38071 14.5 7H13C13 9.20914 14.7909 11 17 11V9.5ZM19.5 7C19.5 8.38071 18.3807 9.5 17 9.5V11C19.2091 11 21 9.20914 21 7H19.5ZM17 4.5C18.3807 4.5 19.5 5.61929 19.5 7H21C21 4.79086 19.2091 3 17 3V4.5ZM17 3C14.7909 3 13 4.79086 13 7H14.5C14.5 5.61929 15.6193 4.5 17 4.5V3ZM6.25 3.75V7H7.75V3.75H6.25ZM6.25 7V10.25H7.75V7H6.25ZM3.75 7.75H7V6.25H3.75V7.75ZM7 7.75H10.25V6.25H7V7.75ZM18.7678 14.1716L16.4697 16.4697L17.5303 17.5303L19.8284 15.2322L18.7678 14.1716ZM16.4697 16.4697L14.1716 18.7678L15.2322 19.8284L17.5303 17.5303L16.4697 16.4697ZM14.1716 15.2322L16.4697 17.5303L17.5303 16.4697L15.2322 14.1716L14.1716 15.2322ZM16.4697 17.5303L18.7678 19.8284L19.8284 18.7678L17.5303 16.4697L16.4697 17.5303ZM5.25 14.5H8.75V13H5.25V14.5ZM9.5 15.25V18.75H11V15.25H9.5ZM8.75 19.5H5.25V21H8.75V19.5ZM4.5 18.75V15.25H3V18.75H4.5ZM5.25 19.5C4.83579 19.5 4.5 19.1642 4.5 18.75H3C3 19.9926 4.00736 21 5.25 21V19.5ZM9.5 18.75C9.5 19.1642 9.16421 19.5 8.75 19.5V21C9.99264 21 11 19.9926 11 18.75H9.5ZM8.75 14.5C9.16421 14.5 9.5 14.8358 9.5 15.25H11C11 14.0074 9.99264 13 8.75 13V14.5ZM5.25 13C4.00736 13 3 14.0074 3 15.25H4.5C4.5 14.8358 4.83579 14.5 5.25 14.5V13Z"
            fill="currentColor"
          />
        </g>
      </>
    ),
    stroke2: (_id) => (
      <>
        <g>
          <path
            d="M8 4C8 3.44772 7.55228 3 7 3C6.44772 3 6 3.44772 6 4H8ZM6 10C6 10.5523 6.44772 11 7 11C7.55228 11 8 10.5523 8 10H6ZM4 6C3.44772 6 3 6.44772 3 7C3 7.55228 3.44772 8 4 8V6ZM10 8C10.5523 8 11 7.55228 11 7C11 6.44772 10.5523 6 10 6V8ZM19.8282 15.5853C20.2187 15.1947 20.2187 14.5616 19.8282 14.1711C19.4377 13.7805 18.8045 13.7805 18.414 14.1711L19.8282 15.5853ZM14.1713 18.4137C13.7808 18.8042 13.7808 19.4374 14.1713 19.8279C14.5619 20.2184 15.195 20.2184 15.5855 19.8279L14.1713 18.4137ZM15.5855 14.1711C15.195 13.7805 14.5619 13.7805 14.1713 14.1711C13.7808 14.5616 13.7808 15.1947 14.1713 15.5853L15.5855 14.1711ZM18.414 19.8279C18.8045 20.2184 19.4377 20.2184 19.8282 19.8279C20.2187 19.4374 20.2187 18.8042 19.8282 18.4137L18.414 19.8279ZM17 9C15.8954 9 15 8.10457 15 7H13C13 9.20914 14.7909 11 17 11V9ZM19 7C19 8.10457 18.1046 9 17 9V11C19.2091 11 21 9.20914 21 7H19ZM17 5C18.1046 5 19 5.89543 19 7H21C21 4.79086 19.2091 3 17 3V5ZM17 3C14.7909 3 13 4.79086 13 7H15C15 5.89543 15.8954 5 17 5V3ZM6 4V7H8V4H6ZM6 7V10H8V7H6ZM4 8H7V6H4V8ZM7 8H10V6H7V8ZM18.414 14.1711L16.2926 16.2924L17.7069 17.7066L19.8282 15.5853L18.414 14.1711ZM16.2926 16.2924L14.1713 18.4137L15.5855 19.8279L17.7069 17.7066L16.2926 16.2924ZM14.1713 15.5853L16.2926 17.7066L17.7069 16.2924L15.5855 14.1711L14.1713 15.5853ZM16.2926 17.7066L18.414 19.8279L19.8282 18.4137L17.7069 16.2924L16.2926 17.7066ZM5.5 15H8.5V13H5.5V15ZM9 15.5V18.5H11V15.5H9ZM8.5 19H5.5V21H8.5V19ZM5 18.5V15.5H3V18.5H5ZM5.5 19C5.22386 19 5 18.7761 5 18.5H3C3 19.8807 4.11929 21 5.5 21V19ZM9 18.5C9 18.7761 8.77614 19 8.5 19V21C9.88071 21 11 19.8807 11 18.5H9ZM8.5 15C8.77614 15 9 15.2239 9 15.5H11C11 14.1193 9.88071 13 8.5 13V15ZM5.5 13C4.11929 13 3 14.1193 3 15.5H5C5 15.2239 5.22386 15 5.5 15V13Z"
            fill="currentColor"
          />
        </g>
      </>
    ),
  },
  images1: {
    viewBox: '0 0 24 24',
    stroke15: (_id) => (
      <>
        <g>
          <path
            d="M4 14.2105L6.84488 12.0821C7.66137 11.5378 8.75215 11.6663 9.41987 12.3853C10.9123 13.9926 12.6426 15.4538 15 15.4538C17.1727 15.4538 18.6125 14.6485 20 13.261M5.75 20.25H18.25C19.3546 20.25 20.25 19.3546 20.25 18.25V5.75C20.25 4.64543 19.3546 3.75 18.25 3.75H5.75C4.64543 3.75 3.75 4.64543 3.75 5.75V18.25C3.75 19.3546 4.64543 20.25 5.75 20.25ZM17.25 8.75C17.25 9.85457 16.3546 10.75 15.25 10.75C14.1454 10.75 13.25 9.85457 13.25 8.75C13.25 7.64543 14.1454 6.75 15.25 6.75C16.3546 6.75 17.25 7.64543 17.25 8.75Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      </>
    ),
    stroke2: (_id) => (
      <>
        <g>
          <path
            d="M4 14.2105L6.84488 12.0821C7.66137 11.5378 8.75215 11.6663 9.41987 12.3853C10.9123 13.9926 12.6426 15.4538 15 15.4538C17.1727 15.4538 18.6125 14.6485 20 13.261M6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20ZM17 9C17 10.1046 16.1046 11 15 11C13.8954 11 13 10.1046 13 9C13 7.89543 13.8954 7 15 7C16.1046 7 17 7.89543 17 9Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </g>
      </>
    ),
  },
  'dot-grid3x3': {
    viewBox: '0 0 24 24',
    stroke15: (_id) => (
      <>
        <g>
          <path
            d="M12 5.75C12.5523 5.75 13 5.30228 13 4.75C13 4.19772 12.5523 3.75 12 3.75C11.4477 3.75 11 4.19772 11 4.75C11 5.30228 11.4477 5.75 12 5.75Z"
            fill="currentColor"
          />
          <path
            d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z"
            fill="currentColor"
          />
          <path
            d="M12 20.25C12.5523 20.25 13 19.8023 13 19.25C13 18.6977 12.5523 18.25 12 18.25C11.4477 18.25 11 18.6977 11 19.25C11 19.8023 11.4477 20.25 12 20.25Z"
            fill="currentColor"
          />
          <path
            d="M19.25 5.75C19.8023 5.75 20.25 5.30228 20.25 4.75C20.25 4.19772 19.8023 3.75 19.25 3.75C18.6977 3.75 18.25 4.19772 18.25 4.75C18.25 5.30228 18.6977 5.75 19.25 5.75Z"
            fill="currentColor"
          />
          <path
            d="M19.25 13C19.8023 13 20.25 12.5523 20.25 12C20.25 11.4477 19.8023 11 19.25 11C18.6977 11 18.25 11.4477 18.25 12C18.25 12.5523 18.6977 13 19.25 13Z"
            fill="currentColor"
          />
          <path
            d="M19.25 20.25C19.8023 20.25 20.25 19.8023 20.25 19.25C20.25 18.6977 19.8023 18.25 19.25 18.25C18.6977 18.25 18.25 18.6977 18.25 19.25C18.25 19.8023 18.6977 20.25 19.25 20.25Z"
            fill="currentColor"
          />
          <path
            d="M4.75 13C5.30228 13 5.75 12.5523 5.75 12C5.75 11.4477 5.30228 11 4.75 11C4.19772 11 3.75 11.4477 3.75 12C3.75 12.5523 4.19772 13 4.75 13Z"
            fill="currentColor"
          />
          <path
            d="M4.75 20.25C5.30228 20.25 5.75 19.8023 5.75 19.25C5.75 18.6977 5.30228 18.25 4.75 18.25C4.19772 18.25 3.75 18.6977 3.75 19.25C3.75 19.8023 4.19772 20.25 4.75 20.25Z"
            fill="currentColor"
          />
          <path
            d="M4.75 5.75C5.30228 5.75 5.75 5.30228 5.75 4.75C5.75 4.19772 5.30228 3.75 4.75 3.75C4.19772 3.75 3.75 4.19772 3.75 4.75C3.75 5.30228 4.19772 5.75 4.75 5.75Z"
            fill="currentColor"
          />
          <path
            d="M12 5.75C12.5523 5.75 13 5.30228 13 4.75C13 4.19772 12.5523 3.75 12 3.75C11.4477 3.75 11 4.19772 11 4.75C11 5.30228 11.4477 5.75 12 5.75Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 20.25C12.5523 20.25 13 19.8023 13 19.25C13 18.6977 12.5523 18.25 12 18.25C11.4477 18.25 11 18.6977 11 19.25C11 19.8023 11.4477 20.25 12 20.25Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M19.25 5.75C19.8023 5.75 20.25 5.30228 20.25 4.75C20.25 4.19772 19.8023 3.75 19.25 3.75C18.6977 3.75 18.25 4.19772 18.25 4.75C18.25 5.30228 18.6977 5.75 19.25 5.75Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M19.25 13C19.8023 13 20.25 12.5523 20.25 12C20.25 11.4477 19.8023 11 19.25 11C18.6977 11 18.25 11.4477 18.25 12C18.25 12.5523 18.6977 13 19.25 13Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M19.25 20.25C19.8023 20.25 20.25 19.8023 20.25 19.25C20.25 18.6977 19.8023 18.25 19.25 18.25C18.6977 18.25 18.25 18.6977 18.25 19.25C18.25 19.8023 18.6977 20.25 19.25 20.25Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4.75 13C5.30228 13 5.75 12.5523 5.75 12C5.75 11.4477 5.30228 11 4.75 11C4.19772 11 3.75 11.4477 3.75 12C3.75 12.5523 4.19772 13 4.75 13Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4.75 20.25C5.30228 20.25 5.75 19.8023 5.75 19.25C5.75 18.6977 5.30228 18.25 4.75 18.25C4.19772 18.25 3.75 18.6977 3.75 19.25C3.75 19.8023 4.19772 20.25 4.75 20.25Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4.75 5.75C5.30228 5.75 5.75 5.30228 5.75 4.75C5.75 4.19772 5.30228 3.75 4.75 3.75C4.19772 3.75 3.75 4.19772 3.75 4.75C3.75 5.30228 4.19772 5.75 4.75 5.75Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </>
    ),
    stroke2: (_id) => (
      <>
        <g>
          <path
            d="M12 6C12.5523 6 13 5.55228 13 5C13 4.44772 12.5523 4 12 4C11.4477 4 11 4.44772 11 5C11 5.55228 11.4477 6 12 6Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 20C12.5523 20 13 19.5523 13 19C13 18.4477 12.5523 18 12 18C11.4477 18 11 18.4477 11 19C11 19.5523 11.4477 20 12 20Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M19 6C19.5523 6 20 5.55228 20 5C20 4.44772 19.5523 4 19 4C18.4477 4 18 4.44772 18 5C18 5.55228 18.4477 6 19 6Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M19 20C19.5523 20 20 19.5523 20 19C20 18.4477 19.5523 18 19 18C18.4477 18 18 18.4477 18 19C18 19.5523 18.4477 20 19 20Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 20C5.55228 20 6 19.5523 6 19C6 18.4477 5.55228 18 5 18C4.44772 18 4 18.4477 4 19C4 19.5523 4.44772 20 5 20Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 6C5.55228 6 6 5.55228 6 5C6 4.44772 5.55228 4 5 4C4.44772 4 4 4.44772 4 5C4 5.55228 4.44772 6 5 6Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </>
    ),
  },
  'lightbulb-glow': {
    viewBox: '0 0 24 24',
    stroke15: (_id) => (
      <>
        <g>
          <path
            d="M2.49012 13.0894L1.53906 13.3984M22.4623 6.60006L21.5112 6.90908M2.49012 6.90863L1.53906 6.59961M22.4623 13.398L21.5112 13.089"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M11.9991 2.75C7.99456 2.75 4.74823 5.99633 4.74823 10.0009C4.74823 12.3433 5.85901 14.4264 7.58257 15.7519C7.62083 15.7814 7.6594 15.8104 7.69826 15.8391C8.30666 16.2881 8.74793 16.961 8.74793 17.7171V18.9988C8.74793 20.7944 10.2035 22.25 11.9991 22.25C13.7947 22.25 15.2503 20.7944 15.2503 18.9988V17.7171C15.2503 16.961 15.6916 16.2881 16.3 15.8391C16.3388 15.8104 16.3774 15.7814 16.4157 15.7519C18.1392 14.4264 19.25 12.3433 19.25 10.0009C19.25 5.99633 16.0037 2.75 11.9991 2.75Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8.74792 17.75H15.2503"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </>
    ),
    stroke2: (_id) => (
      <>
        <g>
          <path
            d="M2.49012 13.0894L1.53906 13.3984M22.4623 6.60006L21.5112 6.90908M2.49012 6.90863L1.53906 6.59961M22.4623 13.398L21.5112 13.089"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M12 3C8.13401 3 5 6.13401 5 10C5 12.5463 6.35958 14.7751 8.39241 16C8.75337 16.2175 9 16.5949 9 17.0163V19C9 20.6569 10.3431 22 12 22C13.6569 22 15 20.6569 15 19V17.0163C15 16.5949 15.2466 16.2175 15.6076 16C17.6404 14.7751 19 12.5463 19 10C19 6.13401 15.866 3 12 3Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M15 18H9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
            strokeLinejoin="round"
          />
        </g>
      </>
    ),
  },
  'sidebar-simple-right-wide': {
    viewBox: '0 0 24 24',
    stroke15: (_id) => (
      <>
        <g>
          <path d="M15.75 5V19" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path
            d="M2.75 6.75C2.75 5.64543 3.64543 4.75 4.75 4.75H19.25C20.3546 4.75 21.25 5.64543 21.25 6.75V17.25C21.25 18.3546 20.3546 19.25 19.25 19.25H4.75C3.64543 19.25 2.75 18.3546 2.75 17.25V6.75Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </g>
      </>
    ),
    stroke2: (_id) => (
      <>
        <g>
          <path
            d="M3 7C3 5.89543 3.89543 5 5 5H19C20.1046 5 21 5.89543 21 7V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M15 5V12V19" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </g>
      </>
    ),
  },
  'chevron-down-small': {
    viewBox: '0 0 24 24',
    stroke15: (_id) => (
      <>
        <g>
          <path
            d="M8 10L11.2929 13.2929C11.6834 13.6834 12.3166 13.6834 12.7071 13.2929L16 10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </>
    ),
    stroke2: (_id) => (
      <>
        <g>
          <path
            d="M8 10L11.2929 13.2929C11.6834 13.6834 12.3166 13.6834 12.7071 13.2929L16 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </>
    ),
  },
  'arrow-inbox': {
    viewBox: '0 0 24 24',
    stroke15: (_id) => (
      <>
        <g>
          <path
            d="M20.25 14.75V18.25C20.25 19.3546 19.3546 20.25 18.25 20.25H5.75C4.64543 20.25 3.75 19.3546 3.75 18.25V14.75M12 15V3.75M12 15L8.5 11.5M12 15L15.5 11.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </>
    ),
    stroke2: (_id) => (
      <>
        <g>
          <path
            d="M20 15V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V15M12 14.5V4M12 14.5L8.5 11M12 14.5L15.5 11"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </>
    ),
  },
  'cross-medium': {
    viewBox: '0 0 24 24',
    stroke15: (_id) => (
      <>
        <g>
          <path
            d="M6.25 6.25L17.75 17.75M17.75 6.25L6.25 17.75"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      </>
    ),
    stroke2: (_id) => (
      <>
        <g>
          <path
            d="M6.5 6.5L17.5 17.5M17.5 6.5L6.5 17.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      </>
    ),
  },
  star: {
    viewBox: '0 0 24 24',
    stroke15: (_id) => (
      <>
        <g>
          <path
            d="M11.3151 2.17969C11.5904 1.60677 12.4096 1.60677 12.6849 2.17969L15.0534 7.10966C15.1643 7.34032 15.3847 7.49956 15.6393 7.5329L21.0889 8.24637C21.7226 8.32933 21.976 9.1071 21.5119 9.54462L17.5278 13.3009C17.3409 13.4772 17.2564 13.7357 17.3034 13.9877L18.3039 19.3544C18.4204 19.9793 17.7574 20.4596 17.1961 20.157L12.3614 17.5509C12.1359 17.4294 11.8641 17.4294 11.6386 17.5509L6.80393 20.157C6.24257 20.4596 5.57955 19.9793 5.69605 19.3544L6.69661 13.9877C6.7436 13.7357 6.65911 13.4772 6.47218 13.3009L2.48806 9.54462C2.024 9.1071 2.27743 8.32933 2.91107 8.24637L8.36069 7.5329C8.61531 7.49956 8.83574 7.34032 8.94656 7.10966L11.3151 2.17969Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </>
    ),
    stroke2: (_id) => (
      <>
        <g>
          <path
            d="M11.5288 2.29524C11.7179 1.90159 12.2821 1.90159 12.4712 2.29524L14.9458 7.44648C15.0219 7.60491 15.1735 7.71434 15.3487 7.73728L21.0456 8.4832C21.4809 8.5402 21.6552 9.07312 21.3368 9.37342L17.1693 13.303C17.0412 13.4238 16.9832 13.6009 17.0154 13.7735L18.0616 19.3857C18.1416 19.8146 17.6852 20.144 17.2993 19.9359L12.249 17.2133C12.0937 17.1296 11.9063 17.1296 11.751 17.2133L6.70073 19.9359C6.3148 20.144 5.85841 19.8146 5.93837 19.3857L6.98459 13.7735C7.01677 13.6009 6.95885 13.4238 6.83068 13.303L2.66324 9.37342C2.34476 9.07312 2.51909 8.5402 2.95444 8.4832L8.65127 7.73728C8.82648 7.71434 8.97811 7.60491 9.05422 7.44648L11.5288 2.29524Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </>
    ),
  },
  'plus-large': {
    viewBox: '0 0 24 24',
    stroke15: (_id) => (
      <>
        <g>
          <path
            d="M12 3.75V12M12 12V20.25M12 12H3.75M12 12H20.25"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </>
    ),
    stroke2: (_id) => (
      <>
        <g>
          <path
            d="M12 4V12M12 12V20M12 12H4M12 12H20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      </>
    ),
  },
  'bars-two': {
    viewBox: '0 0 24 24',
    stroke15: (_id) => (
      <>
        <g>
          <path
            d="M2.75 7.25H21.25M2.75 16.75H21.25"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      </>
    ),
    stroke2: (_id) => (
      <>
        <g>
          <path
            d="M3 7H21M3 17H21"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </>
    ),
  },
  'dot-grid2x3': {
    viewBox: '0 0 24 24',
    stroke15: (_id) => (
      <>
        <g>
          <path
            d="M7.5 5.75C7.5 4.7835 8.2835 4 9.25 4C10.2165 4 11 4.7835 11 5.75C11 6.7165 10.2165 7.5 9.25 7.5C8.2835 7.5 7.5 6.7165 7.5 5.75Z"
            fill="currentColor"
          />
          <path
            d="M13 5.75C13 4.7835 13.7835 4 14.75 4C15.7165 4 16.5 4.7835 16.5 5.75C16.5 6.7165 15.7165 7.5 14.75 7.5C13.7835 7.5 13 6.7165 13 5.75Z"
            fill="currentColor"
          />
          <path
            d="M7.5 18.25C7.5 17.2835 8.2835 16.5 9.25 16.5C10.2165 16.5 11 17.2835 11 18.25C11 19.2165 10.2165 20 9.25 20C8.2835 20 7.5 19.2165 7.5 18.25Z"
            fill="currentColor"
          />
          <path
            d="M13 18.25C13 17.2835 13.7835 16.5 14.75 16.5C15.7165 16.5 16.5 17.2835 16.5 18.25C16.5 19.2165 15.7165 20 14.75 20C13.7835 20 13 19.2165 13 18.25Z"
            fill="currentColor"
          />
          <path
            d="M7.5 11.9C7.5 10.9335 8.2835 10.15 9.25 10.15C10.2165 10.15 11 10.9335 11 11.9V12C11 12.9665 10.2165 13.75 9.25 13.75C8.2835 13.75 7.5 12.9665 7.5 12V11.9Z"
            fill="currentColor"
          />
          <path
            d="M13 11.9C13 10.9335 13.7835 10.15 14.75 10.15C15.7165 10.15 16.5 10.9335 16.5 11.9V12C16.5 12.9665 15.7165 13.75 14.75 13.75C13.7835 13.75 13 12.9665 13 12V11.9Z"
            fill="currentColor"
          />
        </g>
      </>
    ),
    stroke2: (_id) => (
      <>
        <g>
          <path
            d="M10 5C10 5.55228 9.55228 6 9 6C8.44772 6 8 5.55228 8 5C8 4.44772 8.44772 4 9 4C9.55228 4 10 4.44772 10 5Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M10 12C10 12.5523 9.55228 13 9 13C8.44772 13 8 12.5523 8 12C8 11.4477 8.44772 11 9 11C9.55228 11 10 11.4477 10 12Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M10 19C10 19.5523 9.55228 20 9 20C8.44772 20 8 19.5523 8 19C8 18.4477 8.44772 18 9 18C9.55228 18 10 18.4477 10 19Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M16 12C16 12.5523 15.5523 13 15 13C14.4477 13 14 12.5523 14 12C14 11.4477 14.4477 11 15 11C15.5523 11 16 11.4477 16 12Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M16 19C16 19.5523 15.5523 20 15 20C14.4477 20 14 19.5523 14 19C14 18.4477 14.4477 18 15 18C15.5523 18 16 18.4477 16 19Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M16 5C16 5.55228 15.5523 6 15 6C14.4477 6 14 5.55228 14 5C14 4.44772 14.4477 4 15 4C15.5523 4 16 4.44772 16 5Z"
            stroke="currentColor"
            strokeWidth="2"
          />
        </g>
      </>
    ),
  },
  'checkmark1-small': {
    viewBox: '0 0 24 24',
    stroke15: (_id) => (
      <>
        <g>
          <path
            d="M7.75 13.0625L10.9375 16.25L16.25 7.75"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </>
    ),
    stroke2: (_id) => (
      <>
        <g>
          <path
            d="M8 13L11 16L16 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </>
    ),
  },
  play: {
    viewBox: '0 0 24 24',
    stroke15: (_id) => (
      <>
        <g>
          <path
            d="M20.155 10.3209L8.8365 2.99715C7.50578 2.13609 5.75 3.09128 5.75 4.67629V19.3237C5.75 20.9087 7.50577 21.8639 8.8365 21.0029L20.155 13.6791C21.373 12.891 21.373 11.109 20.155 10.3209Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </g>
      </>
    ),
    stroke2: (_id) => (
      <>
        <g>
          <path
            d="M20.245 10.2984L9.05099 3.38443C7.71854 2.56145 6 3.51992 6 5.08603V18.914C6 20.4801 7.71854 21.4385 9.05098 20.6156L20.245 13.7016C21.5104 12.9201 21.5104 11.0799 20.245 10.2984Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </g>
      </>
    ),
  },
  pause: {
    viewBox: '0 0 24 24',
    stroke15: (_id) => (
      <>
        <g>
          <path
            d="M4.75 5.75C4.75 4.64543 5.64543 3.75 6.75 3.75H7.25C8.35457 3.75 9.25 4.64543 9.25 5.75V18.25C9.25 19.3546 8.35457 20.25 7.25 20.25H6.75C5.64543 20.25 4.75 19.3546 4.75 18.25V5.75Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M14.75 5.75C14.75 4.64543 15.6454 3.75 16.75 3.75H17.25C18.3546 3.75 19.25 4.64543 19.25 5.75V18.25C19.25 19.3546 18.3546 20.25 17.25 20.25H16.75C15.6454 20.25 14.75 19.3546 14.75 18.25V5.75Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </g>
      </>
    ),
    stroke2: (_id) => (
      <>
        <g>
          <path
            d="M5 6C5 4.89543 5.89543 4 7 4C8.10457 4 9 4.89543 9 6V18C9 19.1046 8.10457 20 7 20C5.89543 20 5 19.1046 5 18V6Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M15 6C15 4.89543 15.8954 4 17 4C18.1046 4 19 4.89543 19 6V18C19 19.1046 18.1046 20 17 20C15.8954 20 15 19.1046 15 18V6Z"
            stroke="currentColor"
            strokeWidth="2"
          />
        </g>
      </>
    ),
  },
  shuffle: {
    viewBox: '0 0 24 24',
    stroke15: (_id) => (
      <>
        <g>
          <path
            d="M2.75 18.1875H3.97748C4.50771 18.1875 5.01623 17.977 5.39127 17.6021L15.6643 7.33536C16.0393 6.96055 16.5478 6.75 17.0781 6.75H20.5M2.75 5.75H3.92157C4.45201 5.75 4.96071 5.96071 5.33579 6.33579L8.5 9.5M20.5 17.1562H16.9496C16.4132 17.1562 15.8993 16.9408 15.5233 16.5583L13.5 14.5M18.25 3.75L21.25 6.75L18.25 9.75M18.1667 14.0625L21.25 17.1562L18.1667 20.25"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </>
    ),
    stroke2: (_id) => (
      <>
        <g>
          <path
            d="M3 18H4.17157C4.70201 18 5.21071 17.7893 5.58579 17.4142L15.4142 7.58579C15.7893 7.21071 16.298 7 16.8284 7H19M3 6H4.17157C4.70201 6 5.21071 6.21071 5.58579 6.58579L8 9M19 17H16.8284C16.298 17 15.7893 16.7893 15.4142 16.4142L14 15M18 4L21 7L18 10M18 14L21 17L18 20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </>
    ),
  },
  replay: {
    viewBox: '0 0 24 24',
    stroke15: (_id) => (
      <>
        <g>
          <path
            d="M11.1801 14.6739C10.683 15.0219 10 14.6663 10 14.0595V9.94049C10 9.33372 10.683 8.97811 11.1801 9.32607L14.1223 11.3856C14.5488 11.6842 14.5488 12.3158 14.1223 12.6144L11.1801 14.6739Z"
            fill="currentColor"
          />
          <path
            d="M4.13348 8.16128C5.55557 5.253 8.54321 3.25 11.9987 3.25C16.8312 3.25 20.7487 7.16751 20.7487 12C20.7487 16.8325 16.8312 20.75 11.9987 20.75C7.51445 20.75 3.81808 17.3768 3.30859 13.0294"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3.5 4.75V8.75H7.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </>
    ),
    stroke2: (_id) => (
      <>
        <g>
          <path
            d="M11.1801 14.6739C10.683 15.0219 10 14.6663 10 14.0595V9.94049C10 9.33372 10.683 8.97811 11.1801 9.32607L14.1223 11.3856C14.5488 11.6842 14.5488 12.3158 14.1223 12.6144L11.1801 14.6739Z"
            fill="currentColor"
          />
          <path
            d="M4.35727 8.27096C5.73873 5.44577 8.64101 3.5 11.9977 3.5C16.6922 3.5 20.4977 7.30558 20.4977 12C20.4977 16.6944 16.6922 20.5 11.9977 20.5C7.9922 20.5 4.63378 17.7294 3.73438 14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M3.5 5V9H7.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </>
    ),
  },
} satisfies Record<string, IconDefinition>;
