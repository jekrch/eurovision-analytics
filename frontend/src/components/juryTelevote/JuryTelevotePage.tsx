import React from 'react';
import { useContestData } from '../../data/contestData';
import LoadState from '../controls/LoadState';
import Header from '../Header';
import JuryTelevoteScatter from './JuryTelevoteScatter';
import WhatIfRerank from './WhatIfRerank';

/** Since 2016 juries and viewers score separately; where they disagree, and what it would have changed. */
const JuryTelevotePage: React.FC = () => {
    const { data, error } = useContestData();

    return (
        <div className="w-full pb-12">
            <Header eyebrow="Jury vs Televote" title="Where the Juries and the Public Disagree" className="mt-8" />
            {data ? <JuryTelevoteScatter data={data} /> : <LoadState error={error} />}

            <Header eyebrow="What If" title="Re-rank a Final by One Vote" />
            {data ? <WhatIfRerank data={data} /> : <LoadState error={error} />}
        </div>
    );
};

export default JuryTelevotePage;
