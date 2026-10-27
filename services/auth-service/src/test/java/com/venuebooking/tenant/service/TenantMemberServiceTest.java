package com.venuebooking.tenant.service;

import com.venuebooking.auth.entity.User;
import com.venuebooking.auth.repository.UserRepository;
import com.venuebooking.common.BusinessException;
import com.venuebooking.tenant.dto.InviteMemberRequestDto;
import com.venuebooking.tenant.dto.TenantMemberDto;
import com.venuebooking.tenant.dto.UpdateMemberRequestDto;
import com.venuebooking.tenant.entity.TenantMember;
import com.venuebooking.tenant.repository.TenantMemberRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tenant Member & Staff Management Service Tests")
class TenantMemberServiceTest {

    @Mock
    private TenantMemberRepository tenantMemberRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TenantMemberService tenantMemberService;

    private static final Long TENANT_ID = 1L;

    @Test
    @DisplayName("List members returns mapped DTOs for the tenant")
    void testListMembers_Success() {
        User user = User.builder().id(10L).phone("9876543210").name("Alice Staff").email("alice@venue.com").build();
        TenantMember member = TenantMember.builder()
                .id(100L)
                .tenantId(TENANT_ID)
                .userId(10L)
                .user(user)
                .role(TenantMember.Role.STAFF)
                .active(true)
                .assignedVenues("1,2")
                .build();

        when(tenantMemberRepository.findByTenantIdOrderByCreatedAtDesc(TENANT_ID)).thenReturn(List.of(member));

        List<TenantMemberDto> result = tenantMemberService.listMembers(TENANT_ID);

        assertEquals(1, result.size());
        assertEquals("Alice Staff", result.get(0).getName());
        assertEquals("9876543210", result.get(0).getPhone());
        assertEquals("STAFF", result.get(0).getRole());
        assertEquals("1,2", result.get(0).getAssignedVenues());
    }

    @Test
    @DisplayName("Invite member creates user and membership if not existing")
    void testInviteMember_NewUser_Success() {
        InviteMemberRequestDto dto = InviteMemberRequestDto.builder()
                .phone("9998887777")
                .name("Bob Supervisor")
                .email("bob@venue.com")
                .role("MANAGER")
                .assignedVenues("1")
                .build();

        User savedUser = User.builder().id(20L).phone("9998887777").name("Bob Supervisor").email("bob@venue.com").build();
        when(userRepository.findByPhone("9998887777")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(tenantMemberRepository.findByTenantIdAndUserId(TENANT_ID, 20L)).thenReturn(Optional.empty());

        TenantMember savedMember = TenantMember.builder()
                .id(200L)
                .tenantId(TENANT_ID)
                .userId(20L)
                .user(savedUser)
                .role(TenantMember.Role.MANAGER)
                .active(true)
                .assignedVenues("1")
                .build();
        when(tenantMemberRepository.save(any(TenantMember.class))).thenReturn(savedMember);

        TenantMemberDto result = tenantMemberService.inviteMember(TENANT_ID, dto);

        assertNotNull(result);
        assertEquals("Bob Supervisor", result.getName());
        assertEquals("MANAGER", result.getRole());
        assertEquals("1", result.getAssignedVenues());
    }

    @Test
    @DisplayName("Invite member reactivates existing membership")
    void testInviteMember_ExistingMember_ReactivatesAndUpdates() {
        InviteMemberRequestDto dto = InviteMemberRequestDto.builder()
                .phone("9998887777")
                .role("STAFF")
                .assignedVenues("3")
                .build();

        User existingUser = User.builder().id(20L).phone("9998887777").name("Existing Bob").build();
        when(userRepository.findByPhone("9998887777")).thenReturn(Optional.of(existingUser));

        TenantMember existingMember = TenantMember.builder()
                .id(200L)
                .tenantId(TENANT_ID)
                .userId(20L)
                .user(existingUser)
                .role(TenantMember.Role.MANAGER)
                .active(false)
                .assignedVenues("1")
                .build();
        when(tenantMemberRepository.findByTenantIdAndUserId(TENANT_ID, 20L)).thenReturn(Optional.of(existingMember));
        when(tenantMemberRepository.save(existingMember)).thenReturn(existingMember);

        TenantMemberDto result = tenantMemberService.inviteMember(TENANT_ID, dto);

        assertTrue(existingMember.getActive());
        assertEquals(TenantMember.Role.STAFF, existingMember.getRole());
        assertEquals("3", existingMember.getAssignedVenues());
    }

    @Test
    @DisplayName("Update member successfully modifies role and venues")
    void testUpdateMember_Success() {
        TenantMember member = TenantMember.builder()
                .id(100L)
                .tenantId(TENANT_ID)
                .userId(10L)
                .role(TenantMember.Role.STAFF)
                .active(true)
                .build();

        when(tenantMemberRepository.findByIdAndTenantId(100L, TENANT_ID)).thenReturn(Optional.of(member));
        when(tenantMemberRepository.save(member)).thenReturn(member);

        UpdateMemberRequestDto dto = UpdateMemberRequestDto.builder()
                .role("MANAGER")
                .assignedVenues("1,4")
                .active(true)
                .build();

        TenantMemberDto result = tenantMemberService.updateMember(TENANT_ID, 100L, dto);

        assertEquals("MANAGER", member.getRole().name());
        assertEquals("1,4", member.getAssignedVenues());
    }

    @Test
    @DisplayName("Demoting last active owner throws BusinessException")
    void testUpdateMember_DemotingLastOwner_Throws() {
        TenantMember ownerMember = TenantMember.builder()
                .id(100L)
                .tenantId(TENANT_ID)
                .userId(10L)
                .role(TenantMember.Role.OWNER)
                .active(true)
                .build();

        when(tenantMemberRepository.findByIdAndTenantId(100L, TENANT_ID)).thenReturn(Optional.of(ownerMember));
        when(tenantMemberRepository.countByTenantIdAndRoleAndActiveTrue(TENANT_ID, TenantMember.Role.OWNER)).thenReturn(1L);

        UpdateMemberRequestDto dto = UpdateMemberRequestDto.builder()
                .role("MANAGER")
                .build();

        assertThrows(BusinessException.class, () -> tenantMemberService.updateMember(TENANT_ID, 100L, dto));
    }

    @Test
    @DisplayName("Deleting last active owner throws BusinessException")
    void testDeleteMember_LastOwner_Throws() {
        TenantMember ownerMember = TenantMember.builder()
                .id(100L)
                .tenantId(TENANT_ID)
                .userId(10L)
                .role(TenantMember.Role.OWNER)
                .active(true)
                .build();

        when(tenantMemberRepository.findByIdAndTenantId(100L, TENANT_ID)).thenReturn(Optional.of(ownerMember));
        when(tenantMemberRepository.countByTenantIdAndRoleAndActiveTrue(TENANT_ID, TenantMember.Role.OWNER)).thenReturn(1L);

        assertThrows(BusinessException.class, () -> tenantMemberService.deleteMember(TENANT_ID, 100L));
    }

    @Test
    @DisplayName("Delete member soft-deactivates staff member")
    void testDeleteMember_Success() {
        TenantMember staffMember = TenantMember.builder()
                .id(100L)
                .tenantId(TENANT_ID)
                .userId(10L)
                .role(TenantMember.Role.STAFF)
                .active(true)
                .build();

        when(tenantMemberRepository.findByIdAndTenantId(100L, TENANT_ID)).thenReturn(Optional.of(staffMember));

        tenantMemberService.deleteMember(TENANT_ID, 100L);

        assertFalse(staffMember.getActive());
        verify(tenantMemberRepository).save(staffMember);
    }
}
