import { getAboutUser } from '@/config/redux/action/authAction';
import { getAllPosts } from '@/config/redux/action/postAction';
import UserLayout from '@/layout/UserLayout';
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import DashboardLayout from '@/layout/DashboardLayout';

export default function Dashboard() {


    const router = useRouter();

    const dispatch = useDispatch();

    const authState = useSelector((state) => state.auth)

    const [isTokenThere, setIsTokenThere] = useState(false)

    useEffect(() => {
        if (localStorage.getItem('token') === null) {
            router.push("/login")
        }

        setIsTokenThere(true)
    })

    useEffect(() => {
        if (isTokenThere) {
            dispatch(getAllPosts())
            dispatch(getAboutUser({ token: localStorage.getItem('token') }))
        }

    }, [isTokenThere])

    return (
        <UserLayout>
            <DashboardLayout>
                <div>
                    <h1>Dashboard</h1>
                </div>
            </DashboardLayout>

        </UserLayout>
    )
}
