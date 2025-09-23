import React, { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardHeader, CardBody } from '../ui'
import { Button } from '../ui'
import { DashboardLayout } from '../layouts'
import { useMyCreatorProfile, useUpdateCreatorProfile, type CreatorProfileUpdate } from '../../hooks/useCreatorProfile'
import { useAuth } from '../../hooks/useAuth'
import { useErrorHandler } from '../../contexts/ErrorContext'

const SKILL_OPTIONS = [
  'Game Design', 'Illustration', 'Graphic Design', '3D Modeling',
  'Writing', 'Programming', 'Marketing', 'Project Management',
  'Playtesting', 'Rules Writing', 'Art Direction', 'UI/UX Design'
]

const SPECIALTY_OPTIONS = [
  'Board Games', 'Card Games', 'RPGs', 'Miniature Games',
  'Print & Play', 'Digital Games', 'Educational Games', 'Party Games'
]

export function CreatorProfilePage() {
  const navigate = useNavigate()
  const { data: profile, isLoading, error } = useMyCreatorProfile()
  const { mutate: updateProfile, isPending } = useUpdateCreatorProfile()
  const { addError } = useErrorHandler()

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<CreatorProfileUpdate>>({})

  // Initialize form data when profile loads
  React.useEffect(() => {
    if (profile && !isEditing) {
      setFormData({
        display_name: profile.display_name,
        bio: profile.bio || '',
        skills: profile.skills || [],
        specialties: profile.specialties || [],
        portfolio_links: profile.portfolio_links || [],
        experience_level: profile.experience_level,
        availability_status: profile.availability_status,
        preferred_project_types: profile.preferred_project_types || [],
        rate_range: profile.rate_range || '',
        location: profile.location || '',
        time_zone: profile.time_zone || ''
      })
    }
  }, [profile, isEditing])

  const handleSave = async () => {
    if (!formData.display_name?.trim()) {
      addError('Display name is required', 'error')
      return
    }

    try {
      await updateProfile(formData)
      setIsEditing(false)
      addError('Profile updated successfully!', 'success')
    } catch (err) {
      addError('Failed to update profile. Please try again.', 'error')
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({})
  }

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item]
  }

  if (isLoading) {
    return (
      <DashboardLayout currentPage="profile">
        <div className="container">
          <div className="flex justify-center items-center py-8">
            <p>Loading your profile...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout currentPage="profile">
        <div className="container">
          <Card>
            <CardBody>
              <div className="flex flex-col items-center justify-center gap-4 py-8">
                <p className="text-destructive">Failed to load profile</p>
                <Button variant="primary" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout currentPage="profile">
      <div className="container">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1>Creator Profile</h1>
            <p className="text-muted-foreground mt-1">
              Showcase your skills and find collaboration opportunities
            </p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="secondary" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={isPending}
                >
                  {isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button variant="primary" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h3>Basic Information</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Display Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.display_name || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                        className="input w-full"
                        placeholder="Your display name"
                        maxLength={50}
                      />
                    ) : (
                      <p className="text-foreground">{profile?.display_name || 'No name set'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Bio</label>
                    {isEditing ? (
                      <textarea
                        value={formData.bio || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        className="input w-full"
                        rows={3}
                        placeholder="Tell others about yourself and your game development interests..."
                        maxLength={500}
                      />
                    ) : (
                      <p className="text-foreground">{profile?.bio || 'No bio set'}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Experience Level</label>
                      {isEditing ? (
                        <select
                          value={formData.experience_level || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, experience_level: e.target.value as any }))}
                          className="input w-full"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                          <option value="expert">Expert</option>
                        </select>
                      ) : (
                        <p className="text-foreground capitalize">{profile?.experience_level || 'Not set'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Availability</label>
                      {isEditing ? (
                        <select
                          value={formData.availability_status || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, availability_status: e.target.value as any }))}
                          className="input w-full"
                        >
                          <option value="available">Available</option>
                          <option value="limited">Limited Availability</option>
                          <option value="unavailable">Unavailable</option>
                        </select>
                      ) : (
                        <span className={`badge ${
                          profile?.availability_status === 'available' ? 'badge--success' :
                          profile?.availability_status === 'limited' ? 'badge--warning' : 'badge--gray'
                        }`}>
                          {profile?.availability_status === 'available' ? '✅ Available' :
                           profile?.availability_status === 'limited' ? '⏰ Limited' : '❌ Unavailable'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Skills & Specialties */}
            <Card>
              <CardHeader>
                <h3>Skills & Specialties</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Skills</label>
                    {isEditing ? (
                      <div className="flex flex-wrap gap-2">
                        {SKILL_OPTIONS.map(skill => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => setFormData((prev:any) => ({
                              ...prev,
                              skills: toggleArrayItem(prev.skills || [], skill)
                            }))}
                            className={`badge ${
                              (formData.skills || []).includes(skill)
                                ? 'badge--primary'
                                : 'badge--gray'
                            } cursor-pointer`}
                          >
                            {skill}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(profile?.skills || []).map((skill:any) => (
                          <span key={skill} className="badge badge--primary">
                            {skill}
                          </span>
                        ))}
                        {(!profile?.skills || profile.skills.length === 0) && (
                          <p className="text-muted-foreground">No skills selected</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Specialties</label>
                    {isEditing ? (
                      <div className="flex flex-wrap gap-2">
                        {SPECIALTY_OPTIONS.map(specialty => (
                          <button
                            key={specialty}
                            type="button"
                            onClick={() => setFormData((prev:any) => ({
                              ...prev,
                              specialties: toggleArrayItem(prev.specialties || [], specialty)
                            }))}
                            className={`badge ${
                              (formData.specialties || []).includes(specialty)
                                ? 'badge--primary'
                                : 'badge--gray'
                            } cursor-pointer`}
                          >
                            {specialty}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(profile?.specialties || []).map(specialty => (
                          <span key={specialty} className="badge badge--secondary">
                            {specialty}
                          </span>
                        ))}
                        {(!profile?.specialties || profile.specialties.length === 0) && (
                          <p className="text-muted-foreground">No specialties selected</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}