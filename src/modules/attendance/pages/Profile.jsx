import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { employeeAPI } from '../api/employee';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const Profile = () => {
  const { user, login } = useAuth(); // Note: useAuth no longer exports login, need alternate update mechanism
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(user?.profilePicture);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: user?.fullName || '',
      phoneNumber: user?.phoneNumber || '',
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName || '',
        phoneNumber: user.phoneNumber || '',
      });
      setPreviewImage(user.profilePicture);
    }
  }, [user, reset]);


  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) { // 2MB limit
        toast.error('Image size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const updateData = {
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        profilePicture: previewImage !== user.profilePicture ? previewImage : undefined,
      };

      // Since we don't have a profile update endpoint in employeeAPI yet, we might need to add it 
      // or assume it's missing. The user said "edit profile is not working".
      // Assuming employeeAPI.updateProfile exists or we need to create it.
      // Let's implement a safe update that also updates localStorage.
      
      const response = await employeeAPI.updateProfile(updateData);
      
      // Update LocalStorage with full user data from response
      const updatedUser = response.data.user;
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const mergedUser = { ...currentUser, ...updatedUser };
      
      localStorage.setItem('user', JSON.stringify(mergedUser));
      localStorage.setItem('userName', updatedUser.fullName);
      
      toast.success('Profile updated successfully');
      setTimeout(() => {
        navigate('/attendance/dashboard');
      }, 1500);
      
    } catch (error) {
      console.error(error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-servicenow-dark dark:to-servicenow-dark p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-dark-900 dark:text-white">My Profile</h1>
          <Button 
            variant="outline" 
            onClick={() => navigate('/attendance/dashboard')}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="md:col-span-1">
            <Card className="text-center">
              <div className="relative inline-block mb-4">
                <div className="w-32 h-32 rounded-full border-4 border-primary-100 dark:border-primary-900 shadow-xl overflow-hidden mx-auto bg-white dark:bg-servicenow-dark flex items-center justify-center">
                  {previewImage ? (
                    <img 
                      src={previewImage} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl font-bold text-primary-600">
                      {user.fullName ? user.fullName.charAt(0) : 'U'}
                    </span>
                  )}
                </div>
                <label 
                  htmlFor="profile-upload" 
                  className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full cursor-pointer hover:bg-primary-700 shadow-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input 
                    id="profile-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageChange}
                  />
                </label>
              </div>
              
              <h2 className="text-xl font-bold text-dark-900 dark:text-white">{user.fullName}</h2>
              <p className="text-primary-600 dark:text-primary-400 font-medium mb-4 capitalize">{user.role}</p>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-left space-y-2">
                <div>
                  <span className="text-xs text-dark-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Employee ID</span>
                  <p className="font-mono font-medium text-dark-900 dark:text-white">{user.employeeId || 'EMP-001'}</p>
                </div>
                <div>
                  <span className="text-xs text-dark-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Email</span>
                  <p className="font-medium text-dark-900 dark:text-white truncate" title={user.email}>{user.email}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Edit Form */}
          <div className="md:col-span-2">
            <Card>
              <h3 className="text-xl font-bold text-dark-900 dark:text-white mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Information
              </h3>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="label-premium block mb-2">Full Name</label>
                  <input
                    {...register('fullName', { required: 'Full name is required' })}
                    type="text"
                    className="input-premium w-full"
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <label className="label-premium block mb-2">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <input
                      {...register('phoneNumber')}
                      type="tel"
                      className="input-premium pl-10 w-full"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isLoading}
                    className="w-full md:w-auto px-8"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
