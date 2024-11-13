import React, { useState, useContext, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
const server = process.env.REACT_APP_SERVER;

const UpdateCompany = () => {
    // if all else fails try useEffect again
    const [tokenObj, setTokenObj] = useState(() => {
        const token = localStorage.getItem("token");
        return token ? JSON.parse(atob(token.split('.')[1])) : null;
    });

    // init usestates - companyInfo is just to load company Info, company is to update company
    const [companyInfo, getCompanyInfo] = useState([]);
    const [company, setCompany] = useState({
        compid: null,
        company: "",
        address: "",
        contact_num: "",
        email: "",
        website: "",
        industryid: null,
        size: null,
        statusid: null,
        est_date: ""
    })

    // init usestate for fetching data
    const [industry, setIndustry] = useState([]);
    const [status , setStatus] = useState([]);

    const navigate = useNavigate();
    const location = useLocation();
    // console.log(location);
    const compid = location.pathname.split('/')[2]

    // fetch data
    const fetchCompany = async () => {
        try {
            const res = await axios.get(`${server}company/${compid}`);
            getCompanyInfo(res.data);
        } catch (error) {
            console.log(error);
        }
    }

    const fetchIndustry = async () => {
        try {
            const response = await axios.get(`${server}industry`);
            setIndustry(response.data);
        } catch (error) {
            console.log(error);
        }
    };

    const fetchStatus = async () => {
        try {
            const response = await axios.get(`${server}status`);
            setStatus(response.data);
        } catch (error) {
            console.log(error);
        }
    };

    const handleChange = (e) => {
        setCompany((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleClick = async (e) => {
        e.preventDefault();

        // Check if any input field is the same as the current company's info
        for (const key in company) {
            if (company[key] === companyInfo[key]) {
                window.alert(`${key} is the same as the current company's info`);
                return;
            }
        }

        try {
            await axios.put(`${server}company/${compid}`, company);
            window.alert("Company updated successfully");
            window.location.reload();
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (!tokenObj || (tokenObj.role !== 1 && tokenObj.role !== 5)) {
            window.alert("You are not authorized to view this page");
            navigate("/", { replace: true });
        }

        // If tokenObj is still null, don't render the content yet
        if (tokenObj === null) {
            return null;  // You can replace this with a loading indicator if you prefer
        }
        const fetchData = async () => {
            await fetchCompany();
            await fetchIndustry();
            await fetchStatus();
        };
        fetchData();
    }, [navigate, tokenObj])

    console.log(companyInfo);
    return (
        <div className="update-form">
            <h1>Update company at:</h1>
            <h2>Company ID {companyInfo.compid}, {companyInfo.company}</h2>
            <select name="status" onChange={handleChange}>
                <option value="" disabled selected>Select status</option>
                {status.map((s) => (
                    <option key={s.statusid} value={s.statusid}>{s.status}</option>
                ))}
            </select>
            <input type="text" placeholder='company name' onChange={handleChange} name="company" />
            <input type="text" placeholder='address' onChange={handleChange} name="address" />
            <input type="text" placeholder='contact' onChange={handleChange} name='contact_num' />
            <input type="email" placeholder='email' onChange={handleChange} name='email' />
            <input type="text" placeholder='website' onChange={handleChange} name='website' />
            <select name="industryid" onChange={handleChange}>
                <option value="" disabled selected>Select industry</option>
                {industry.map((i) => (
                    <option key={i.industryid} value={i.industryid}>{i.industry}</option>
                ))}
            </select>
            <input type="number" placeholder='size'onChange={handleChange} name='size' />
            <input type="date" placeholder='est. date' onChange={handleChange} name='est_date' />
            

            <button onClick={handleClick}>Update</button>
        </div>
    )
}

export default UpdateCompany;