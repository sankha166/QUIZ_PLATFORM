import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from '../common/NotificationBell';

const navItems = [
  { path: '/student/dashboard', label: 'Dashboard' },
  { path: '/student/quizzes', label: 'Quizzes' },
  { path: '/student/attempts', label: 'My Attempts' },
  { path: '/student