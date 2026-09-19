import React from 'react';
import { useContestData } from '../../data/contestData';
import LoadState from '../controls/LoadState';
import Header from '../Header';
import CountryReportCard from './CountryReportCard';

/** One country's whole Eurovision history on a single card. */
const CountriesPage: React.FC = () => {
    const { data, error } = useContestData();

    return (
        <div className="w-full pb-12">
            <Header eyebrow="Countries" title="Country Report Card" className="mt-8" />
            {data ? <CountryReportCard data={data} /> : <LoadState error={error} />}
        </div>
    );
};

export default CountriesPage;
