import React from 'react';
import { useContestData } from '../../data/contestData';
import LoadState from '../controls/LoadState';
import Header from '../Header';
import DouzePoints from './DouzePoints';
import FriendshipTest from './FriendshipTest';
import VotingNetwork from './VotingNetwork';

/** Who votes for whom: blocs, one-on-one friendships and where the 12s go. */
const VotingPage: React.FC = () => {
    const { data, error } = useContestData();

    return (
        <div className="w-full pb-12">
            <Header eyebrow="Voting Blocs" title="Who Votes for Whom" className="mt-8" />
            {data ? <VotingNetwork data={data} /> : <LoadState error={error} />}

            <Header eyebrow="Friendship Test" title="How Two Countries Vote for Each Other" />
            {data ? <FriendshipTest data={data} /> : <LoadState error={error} />}

            <Header eyebrow="Douze Points" title="Where the 12s Go" />
            {data ? <DouzePoints data={data} /> : <LoadState error={error} />}
        </div>
    );
};

export default VotingPage;
