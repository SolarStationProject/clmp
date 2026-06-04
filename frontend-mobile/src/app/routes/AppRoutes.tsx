import { Routes, Route, Navigate } from 'react-router-dom';
import SplashScreen  from '../../components/screens/auth/SplashScreen';
import HomeScreen    from '../../components/screens/main/HomeScreen';
import MapScreen     from '../../components/screens/main/MapScreen';
import MyReportsList from '../../components/screens/main/MyReportsList';
import MyReportDetail from '../../components/screens/main/MyReportDetail';
import ReportDetail  from '../../components/screens/main/ReportDetail';

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/"                    element={<SplashScreen />} />
            <Route path="/home"                element={<HomeScreen />} />
            <Route path="/map"                 element={<MapScreen />} />
            <Route path="/my-reports"          element={<MyReportsList />} />
            <Route path="/report-detail"       element={<MyReportDetail />} />
            <Route path="/other-report-detail" element={<ReportDetail />} />
            <Route path="*"                    element={<Navigate to="/home" replace />} />
        </Routes>
    );
}
