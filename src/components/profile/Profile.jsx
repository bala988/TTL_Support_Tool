import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Camera, Save, User as UserIcon, Phone, MapPin, FileText, Activity, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../modules/attendance/hooks/useAuth';
import { userAPI } from '../../api/user';
import Card from '../../modules/attendance/components/ui/Card';
import Button from '../../modules/attendance/components/ui/Button';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profilePreview, setProfilePreview] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      email: "",
      employeeId: "",
      role: "",
      homeAddress: "",
      aadharNumber: "",
      panNumber: "",
      bloodGroup: "",
      emergencyContact: "",
      newPassword: ""
    }
  });

  useEffect(() => {
    const fetchLatestProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`}/api/auth/me`, {
           headers: {
             'Authorization': `Bearer ${token}`
           }
        });
        
        if (response.ok) {
           const data = await response.json();
           const userData = data.user;
           
           // Update Form
           setValue("fullName", userData.name || "");
           setValue("phoneNumber", userData.phone || "");
           setValue("email", userData.email || "");
           setValue("employeeId", userData.employeeId || "EMP001"); // Might not be in SQL, logic fallback?
           // Actually SQL doesn't store employeeId usually in this schema, wait. 
           // useAuth had defaults. Let's keep existing user object for fallbacks if needed, or merge.
           
           setValue("role", userData.role || "Engineer");
           setValue("homeAddress", userData.homeAddress || "");
           setValue("aadharNumber", userData.aadharNumber || "");
           setValue("panNumber", userData.panNumber || "");
           setValue("bloodGroup", userData.bloodGroup || "");
           setValue("emergencyContact", userData.emergencyContact || "");
           
           if (userData.profilePicture) {
             setProfilePreview(userData.profilePicture);
           }
           
           // Update LocalStorage to keep app in sync
           const currentStored = JSON.parse(localStorage.getItem('user') || '{}');
           const updatedStored = { ...currentStored, ...userData };
           // Ensure legacy fields mapping if needed, but getMe returns camelCase now which matches valid keys
           updatedStored.profile_picture = userData.profilePicture; // Legacy support
           
           localStorage.setItem('user', JSON.stringify(updatedStored));
        }
      } catch (error) {
        console.error("Failed to fetch fresh profile", error);
      }
    };

    if (user) {
      // Initialize with what we have first (optimistic)
      setValue("fullName", user.fullName || user.name || "");
      setValue("phoneNumber", user.phoneNumber || user.phone || "");
      setValue("email", user.email || "");
      setValue("employeeId", user.employeeId || "EMP001");
      setValue("role", user.role || "Employee");
      setValue("homeAddress", user.homeAddress || user.home_address || "");
      setValue("aadharNumber", user.aadharNumber || user.aadhar_number || "");
      setValue("panNumber", user.panNumber || user.pan_number || "");
      setValue("bloodGroup", user.bloodGroup || user.blood_group || "");
      setValue("emergencyContact", user.emergencyContact || user.emergency_contact || "");
      
      if (user.profilePicture || user.profile_picture) {
        setProfilePreview(user.profilePicture || user.profile_picture);
      }
      
      // Then fetch fresh properties
      fetchLatestProfile();
    }
  }, [user, setValue]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        homeAddress: data.homeAddress,
        aadharNumber: data.aadharNumber,
        panNumber: data.panNumber,
        bloodGroup: data.bloodGroup,
        emergencyContact: data.emergencyContact,
        profilePicture: profilePreview,
        newPassword: data.newPassword ? data.newPassword : undefined
      };

      const response = await userAPI.updateProfile(payload);
      
      // Update local storage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Merge all fields
      const updatedUser = { 
        ...currentUser,
        // Update both camelCase and legacy fields
        name: data.fullName,
        fullName: data.fullName,
        phone: data.phoneNumber,
        phoneNumber: data.phoneNumber,
        profile_picture: profilePreview,
        profilePicture: profilePreview,
        homeAddress: data.homeAddress,
        home_address: data.homeAddress,
        aadharNumber: data.aadharNumber,
        aadhar_number: data.aadharNumber,
        panNumber: data.panNumber,
        pan_number: data.panNumber,
        bloodGroup: data.bloodGroup,
        blood_group: data.bloodGroup,
        emergencyContact: data.emergencyContact,
        emergency_contact: data.emergencyContact
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success("Profile updated successfully");
      
      setTimeout(() => {
        navigate('/engineer/dashboard');
      }, 1500);

    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="p-8 text-center">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your account information and preferences</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-6">
          {/* Personal Info Card */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-primary-500" />
              Personal Information
            </h2>
            
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              {/* Profile Picture */}
              <div className="flex flex-col items-center space-y-3">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 dark:border-gray-700 shadow-lg bg-gray-100 dark:bg-gray-800">
                    {profilePreview ? (
                      <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400">
                        {user?.fullName?.charAt(0) || user?.name?.charAt(0) || "U"}
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-1 right-1 p-2 bg-primary-600 text-white rounded-full cursor-pointer hover:bg-primary-700 transition-colors shadow-md">
                    <Camera className="w-4 h-4" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
                <span className="text-xs text-gray-500">Max 5MB (JPG, PNG)</span>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <div className="relative">
                    <input
                      {...register("fullName", { required: "Full name is required" })}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="Enter your full name"
                    />
                    <UserIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                  </div>
                  {errors.fullName && <span className="text-xs text-red-500 mt-1">{errors.fullName.message}</span>}
                </div>

                {/* Email (Read Only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                  <input
                    {...register("email")}
                    disabled
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-500 cursor-not-allowed"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                  <div className="relative">
                    <input
                      {...register("phoneNumber", { 
                        required: "Phone number is required",
                        pattern: { value: /^[0-9]{10}$/, message: "Invalid phone number" }
                      })}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="10-digit number"
                    />
                    <Phone className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                  </div>
                  {errors.phoneNumber && <span className="text-xs text-red-500 mt-1">{errors.phoneNumber.message}</span>}
                </div>

                {/* Role (Read Only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                  <input
                    {...register("role")}
                    disabled
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-500 cursor-not-allowed capitalize"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Home Address</label>
              <div className="relative">
                <textarea
                  {...register("homeAddress")}
                  rows="3"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Enter complete address"
                />
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              </div>
            </div>
          </Card>

          {/* Official Documents & Emergency Info */}
          <Card className="p-6">
             <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-500" />
              Documents & Emergency Info
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Aadhar Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aadhar Number</label>
                <div className="relative">
                   <input
                      {...register("aadharNumber", { 
                         pattern: { value: /^\d{12}$/, message: "Valid 12-digit Aadhar required" } 
                      })}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="1234 5678 9012"
                   />
                   <FileText className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                </div>
                 {errors.aadharNumber && <span className="text-xs text-red-500 mt-1">{errors.aadharNumber.message}</span>}
              </div>

              {/* PAN Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PAN Number</label>
                <div className="relative">
                   <input
                      {...register("panNumber", { 
                         pattern: { value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, message: "Valid PAN format required" } 
                      })}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all uppercase"
                      placeholder="ABCDE1234F"
                   />
                   <FileText className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                </div>
                 {errors.panNumber && <span className="text-xs text-red-500 mt-1">{errors.panNumber.message}</span>}
              </div>

              {/* Blood Group */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Blood Group</label>
                <div className="relative">
                   <select
                      {...register("bloodGroup")}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all appearance-none"
                   >
                     <option value="">Select Blood Group</option>
                     <option value="A+">A+</option>
                     <option value="A-">A-</option>
                     <option value="B+">B+</option>
                     <option value="B-">B-</option>
                     <option value="O+">O+</option>
                     <option value="O-">O-</option>
                     <option value="AB+">AB+</option>
                     <option value="AB-">AB-</option>
                   </select>
                   <Activity className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Emergency Contact</label>
                <div className="relative">
                   <input
                      {...register("emergencyContact", {
                         pattern: { value: /^[0-9]{10}$/, message: "Invalid phone number" }
                      })}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="Emergency contact number"
                   />
                   <AlertCircle className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                </div>
                 {errors.emergencyContact && <span className="text-xs text-red-500 mt-1">{errors.emergencyContact.message}</span>}
              </div>
              {/* Update Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Update Password</label>
                <input
                  {...register("newPassword")}
                  type="password"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Enter new password"
                />
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
             <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/engineer/dashboard')}
                disabled={loading}
             >
                Cancel
             </Button>
             <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="min-w-[120px]"
             >
                {loading ? (
                   <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Saving...
                   </span>
                ) : (
                   <span className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Save Changes
                   </span>
                )}
             </Button>
          </div>

        </div>
      </form>
    </div>
  );
};

export default Profile;
